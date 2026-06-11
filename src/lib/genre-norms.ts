import type { AudioFeatures } from "@/lib/audio-analysis";

/**
 * Genre norms + deterministic scoring priors (score engine v2).
 *
 * The instant read's measurements only become gradeable when compared against
 * what's NORMAL for the genre — "intro lift at 24s" is meaningless on its own,
 * "2× the pop median" is a finding. This module:
 *
 *   1. maps a free-text genre to a norm family,
 *   2. turns raw AudioFeatures into genre-relative delta lines for the prompt,
 *   3. derives repetition/novelty stats from the stored 3-band waveform
 *      (pure TS — no worker change needed), and
 *   4. computes deterministic 0–5 PRIORS for production + structure that the
 *      grading pass must stay near — so two tracks with different masters can
 *      never collapse onto the same number.
 *
 * Norm values are initial engineering estimates; the reference-corpus pass
 * (Option D) recalibrates them from measured released music. Loudness fields
 * compare against the worker's `loudnessLufs`, which is actually mono-16kHz
 * RMS dBFS (reads a few dB below streaming LUFS).
 */

export type GenreFamily =
  | "electronic"
  | "hiphop"
  | "pop"
  | "rnb"
  | "rock"
  | "acoustic"
  | "lofi"
  | "other";

export type GenreNorms = {
  family: GenreFamily;
  label: string;
  /** RMS dBFS window for a release-grade master [too-quiet-below, too-hot-above]. */
  rmsDb: [number, number];
  /** Crest factor (peak-RMS, dB): below floor = squashed; above ceiling = unmastered/quiet. */
  crestDb: [number, number];
  /** Seconds to first real lift: [median, long-side]. Past `long` costs attention. */
  introLiftSec: [number, number];
  tempo: [number, number];
  /** How much literal repetition the genre tolerates before it reads as monotony. */
  repetitionTolerance: "low" | "medium" | "high";
  /** One-liner the prompts can cite. */
  note: string;
};

const NORMS: Record<GenreFamily, GenreNorms> = {
  electronic: {
    family: "electronic",
    label: "electronic / house / techno / edm",
    rmsDb: [-15, -8],
    crestDb: [6, 14],
    introLiftSec: [20, 60],
    tempo: [110, 150],
    repetitionTolerance: "high",
    note: "long intros, sustained energy and loop-based repetition are deliberate genre conventions — judge execution, not the convention itself.",
  },
  hiphop: {
    family: "hiphop",
    label: "hip-hop / trap / rap",
    rmsDb: [-14, -7.5],
    crestDb: [6, 13],
    introLiftSec: [8, 25],
    tempo: [60, 160],
    repetitionTolerance: "high",
    note: "loop-based beats are the form; differentiation comes from the vocal performance, the bounce and the low end.",
  },
  pop: {
    family: "pop",
    label: "pop / indie pop",
    rmsDb: [-14, -8],
    crestDb: [6, 13],
    introLiftSec: [5, 18],
    tempo: [85, 130],
    repetitionTolerance: "low",
    note: "the hook must land fast and sections must move — listeners give pop the least patience of any genre.",
  },
  rnb: {
    family: "rnb",
    label: "r&b / soul",
    rmsDb: [-15, -9],
    crestDb: [7, 14],
    introLiftSec: [8, 25],
    tempo: [60, 110],
    repetitionTolerance: "medium",
    note: "groove and vocal performance carry it; dynamics matter more than loudness.",
  },
  rock: {
    family: "rock",
    label: "rock / metal / indie rock",
    rmsDb: [-15, -8.5],
    crestDb: [7, 15],
    introLiftSec: [10, 35],
    tempo: [90, 180],
    repetitionTolerance: "medium",
    note: "energy and performance feel beat polish; sustained walls of sound are a deliberate choice in heavier styles.",
  },
  acoustic: {
    family: "acoustic",
    label: "acoustic / singer-songwriter / folk",
    rmsDb: [-20, -11],
    crestDb: [9, 18],
    introLiftSec: [8, 30],
    tempo: [60, 130],
    repetitionTolerance: "medium",
    note: "intimacy and dynamics are the point — a quiet, wide master is correct here, not a fault.",
  },
  lofi: {
    family: "lofi",
    label: "lo-fi / chill / ambient",
    rmsDb: [-18, -10],
    crestDb: [7, 16],
    introLiftSec: [10, 45],
    tempo: [60, 110],
    repetitionTolerance: "high",
    note: "texture and mood over structure; gentle repetition is the format.",
  },
  other: {
    family: "other",
    label: "general",
    rmsDb: [-17, -8.5],
    crestDb: [6, 15],
    introLiftSec: [10, 35],
    tempo: [60, 180],
    repetitionTolerance: "medium",
    note: "judged on general listener attention norms.",
  },
};

export function genreFamily(genre: string | null | undefined): GenreFamily {
  const g = (genre ?? "").toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => g.includes(k));
  if (has("house", "techno", "edm", "electronic", "dance", "dnb", "drum", "dubstep", "trance"))
    return "electronic";
  if (has("hip", "trap", "rap", "drill", "grime")) return "hiphop";
  if (has("lo-fi", "lofi", "chill", "ambient")) return "lofi";
  if (has("r&b", "rnb", "soul")) return "rnb";
  if (has("rock", "metal", "punk", "grunge")) return "rock";
  if (has("acoustic", "singer", "songwriter", "folk", "country")) return "acoustic";
  if (has("pop")) return "pop";
  return "other";
}

export function genreNorms(genre: string | null | undefined): GenreNorms {
  return NORMS[genreFamily(genre)];
}

// ── Waveform-derived stats (repetition / novelty, no worker change) ──

export type WaveformStats = {
  /** 0–1: how much consecutive ~8s windows repeat each other. High = loopy. */
  selfSimilarity: number;
  /** 0–1: how much the band-energy picture changes across the track. */
  novelty: number;
  /** 0–1 share of near-silent columns (long dead air reads as unfinished). */
  quietShare: number;
};

function b64Bytes(b64: string): Uint8Array | null {
  try {
    const buf = Buffer.from(b64, "base64");
    return buf.length ? new Uint8Array(buf) : null;
  } catch {
    return null;
  }
}

/**
 * Repetition/novelty from the report waveform's band columns. Windows of ~8s
 * are compared pairwise at one-window lag (normalized band-shape distance);
 * high similarity = the same material cycling.
 */
export function waveformStats(
  waveform: { n?: number; lo?: string; mid?: string; hi?: string; durationSec?: number | null } | null | undefined
): WaveformStats | null {
  if (!waveform?.lo || !waveform.mid || !waveform.hi) return null;
  const lo = b64Bytes(waveform.lo);
  const mid = b64Bytes(waveform.mid);
  const hi = b64Bytes(waveform.hi);
  if (!lo || !mid || !hi || lo.length < 64) return null;
  const n = Math.min(lo.length, mid.length, hi.length);
  const dur = waveform.durationSec ?? null;
  // window ≈ 8 seconds of columns (fallback: 1/24 of the track)
  const win = Math.max(8, Math.round(dur ? (8 / dur) * n : n / 24));
  const windows: number[][] = [];
  for (let s = 0; s + win <= n; s += win) {
    let l = 0, m = 0, h = 0, a = 0;
    for (let i = s; i < s + win; i++) {
      l += lo[i]; m += mid[i]; h += hi[i];
      a += Math.max(lo[i], mid[i], hi[i]);
    }
    windows.push([l / win, m / win, h / win, a / win]);
  }
  if (windows.length < 3) return null;

  // self-similarity: 1 - normalized distance between consecutive windows
  let simSum = 0;
  let novSum = 0;
  for (let i = 1; i < windows.length; i++) {
    const [l1, m1, h1, a1] = windows[i - 1];
    const [l2, m2, h2, a2] = windows[i];
    const scale = Math.max(a1, a2, 1);
    const d =
      (Math.abs(l1 - l2) + Math.abs(m1 - m2) + Math.abs(h1 - h2)) / (3 * scale);
    simSum += Math.max(0, 1 - Math.min(1, d * 2.5));
    novSum += Math.min(1, d * 2.5);
  }
  const cmp = windows.length - 1;

  let quiet = 0;
  for (let i = 0; i < n; i++) {
    if (Math.max(lo[i], mid[i], hi[i]) < 10) quiet++;
  }

  return {
    selfSimilarity: Math.round((simSum / cmp) * 100) / 100,
    novelty: Math.round((novSum / cmp) * 100) / 100,
    quietShare: Math.round((quiet / n) * 100) / 100,
  };
}

// ── Genre-relative deltas (prompt lines) + deterministic priors ──────

export type MeasuredPriors = {
  /** 0–5 production prior, when enough was measured. */
  production: number | null;
  /** 0–5 structure/retention prior. */
  structure: number | null;
  /** Human-readable basis lines — fed to the grading prompt so the clamp is explainable. */
  basis: string[];
};

const r1 = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Genre-relative observations as prompt-ready lines. Only emits lines where a
 * measurement exists AND deviates enough to matter — silence is "in the pocket".
 */
export function normDeltaLines(
  f: AudioFeatures,
  genre: string | null | undefined,
  stats: WaveformStats | null
): string[] {
  const nm = genreNorms(genre);
  const lines: string[] = [];
  lines.push(`genre norms applied: ${nm.label} — ${nm.note}`);

  if (f.loudnessLufs != null) {
    const [quiet, hot] = nm.rmsDb;
    if (f.loudnessLufs < quiet - 1.5)
      lines.push(
        `loudness: ${r1(quiet - f.loudnessLufs)}dB under the release window for this genre — reads as an unmastered or demo-stage bounce.`
      );
    else if (f.loudnessLufs > hot + 1)
      lines.push(
        `loudness: pushed ${r1(f.loudnessLufs - hot)}dB past the genre's typical ceiling — likely paying for it in squash.`
      );
    else lines.push(`loudness: inside the genre's release window.`);
  }

  const crest = (f as { crestDb?: number }).crestDb;
  if (crest != null) {
    const [floor, ceil] = nm.crestDb;
    if (crest < floor - 0.5)
      lines.push(
        `dynamics: crest factor ${r1(crest)}dB vs a genre floor around ${floor}dB — audibly over-compressed.`
      );
    else if (crest > ceil + 2)
      lines.push(
        `dynamics: very wide (crest ${r1(crest)}dB) — dynamic, but may read as an unfinished master at genre loudness.`
      );
    else lines.push(`dynamics: healthy for the genre (crest ${r1(crest)}dB).`);
  }

  if (f.introLiftSec != null) {
    const [median, long] = nm.introLiftSec;
    if (f.introLiftSec > long)
      lines.push(
        `intro: first lift at ~${Math.round(f.introLiftSec)}s — past the ${long}s long-side mark for this genre (median ~${median}s); expect early drop-off.`
      );
    else if (f.introLiftSec <= median)
      lines.push(`intro: gets moving by ~${Math.round(f.introLiftSec)}s — inside the genre's patience window.`);
  }

  if (f.tempo != null && (f.tempo < nm.tempo[0] - 10 || f.tempo > nm.tempo[1] + 10)) {
    lines.push(
      `tempo: ${Math.round(f.tempo)} BPM sits outside the genre's usual ${nm.tempo[0]}–${nm.tempo[1]} range — fine if intentional, worth noting.`
    );
  }

  if (stats) {
    if (stats.selfSimilarity > 0.82 && nm.repetitionTolerance === "low")
      lines.push(
        `repetition: the band-energy picture barely changes window to window — in this genre that reads as monotony, not hypnosis.`
      );
    else if (stats.selfSimilarity > 0.9 && nm.repetitionTolerance === "medium")
      lines.push(`repetition: very loop-static even by this genre's standards.`);
    else if (stats.novelty > 0.5)
      lines.push(`movement: the arrangement keeps changing — strong novelty across the track.`);
    if (stats.quietShare > 0.12)
      lines.push(`dead air: ~${Math.round(stats.quietShare * 100)}% of the analysed span is near-silent.`);
  }

  const sectionKinds = new Set((f.sections ?? []).map((s) => s.kind));
  if (f.sections && f.sections.length >= 4 && sectionKinds.size >= 3)
    lines.push(`structure: ${f.sections.length} sections across ${sectionKinds.size} distinct types — a real arrangement arc.`);

  return lines;
}

/**
 * Deterministic 0–5 priors for the dimensions a measurement can actually
 * defend. Conservative by design: they start at 3.0 and move only on real
 * evidence; null when too little was measured to have an opinion.
 */
export function computePriors(
  f: AudioFeatures | null,
  genre: string | null | undefined,
  stats: WaveformStats | null
): MeasuredPriors {
  if (!f) return { production: null, structure: null, basis: [] };
  const nm = genreNorms(genre);
  const basis: string[] = [];

  // ── production prior ──
  let prod: number | null = null;
  let prodSignals = 0;
  let p = 3.0;
  if (f.loudnessLufs != null) {
    prodSignals++;
    const [quiet, hot] = nm.rmsDb;
    if (f.loudnessLufs < quiet - 4) { p -= 1.0; basis.push("loudness far under release level"); }
    else if (f.loudnessLufs < quiet - 1.5) { p -= 0.5; basis.push("loudness under the genre window"); }
    else if (f.loudnessLufs <= hot + 1) { p += 0.5; basis.push("release-window loudness"); }
    else { p -= 0.3; basis.push("loudness pushed past the genre ceiling"); }
  }
  const crest = (f as { crestDb?: number }).crestDb;
  if (crest != null) {
    prodSignals++;
    const [floor, ceil] = nm.crestDb;
    if (crest < floor - 1.5) { p -= 0.7; basis.push("heavily over-compressed"); }
    else if (crest < floor - 0.5) { p -= 0.3; basis.push("on the squashed side"); }
    else if (crest <= ceil) { p += 0.4; basis.push("healthy dynamics"); }
  }
  if (f.spectral) {
    prodSignals++;
    const lowEnd = f.spectral.sub + f.spectral.bass;
    if (lowEnd > 0.78) { p -= 0.4; basis.push("low end dominates the spectrum (mud risk)"); }
    else if (lowEnd < 0.06) { p -= 0.4; basis.push("almost no low end"); }
    if (f.spectral.high > 0.8) { p -= 0.3; basis.push("very top-heavy (harshness risk)"); }
  }
  if (prodSignals >= 2) prod = r1(clamp(p, 1, 4.6));

  // ── structure / retention prior ──
  let struct: number | null = null;
  let structSignals = 0;
  let s = 3.0;
  // Long-form: we only analysed the opening of a much longer track. Intro-length
  // norms are meaningless there (a 10-min progressive build is the form), so the
  // intro penalty only applies when we saw substantially the whole song.
  const longForm =
    f.sourceDurationSec != null &&
    f.durationSec != null &&
    f.sourceDurationSec > f.durationSec * 1.4;
  if (f.introLiftSec != null && !longForm) {
    structSignals++;
    const [, long] = nm.introLiftSec;
    if (f.introLiftSec > long * 1.5) { s -= 0.8; basis.push("intro runs way past the genre's patience"); }
    else if (f.introLiftSec > long) { s -= 0.4; basis.push("long intro for the genre"); }
    else { s += 0.2; }
  }
  if (f.sections?.length) {
    structSignals++;
    const kinds = new Set(f.sections.map((x) => x.kind));
    if (f.sections.length >= 4 && kinds.size >= 3) { s += 0.5; basis.push("real arrangement arc"); }
    else if (f.sections.length <= 1 && nm.repetitionTolerance === "low") { s -= 0.5; basis.push("reads as one continuous block"); }
  }
  if (stats) {
    structSignals++;
    if (stats.selfSimilarity > 0.82 && nm.repetitionTolerance === "low") { s -= 0.6; basis.push("loop-static in a low-repetition genre"); }
    else if (stats.selfSimilarity > 0.9 && nm.repetitionTolerance === "medium") { s -= 0.3; basis.push("very repetitive"); }
    else if (stats.novelty > 0.45) { s += 0.3; basis.push("keeps evolving"); }
    if (stats.quietShare > 0.12) { s -= 0.3; basis.push("notable dead air"); }
  }
  if ((f.energyDips?.length ?? 0) >= 3) { s -= 0.2; basis.push("multiple deep energy dips"); }
  if (structSignals >= 2) struct = r1(clamp(s, 1, 4.6));

  return { production: prod, structure: struct, basis };
}
