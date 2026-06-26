/**
 * Decision-report (verdict) payload builder.
 *
 * Turns a generated report + the real measured audio into the verdict layout's
 * persisted shapes:
 *   - `releaseBar`: per-axis measured value vs the genre's release envelope.
 *   - `blockers`:   the priority fixes, ranked, framed as release blockers.
 *
 * Honesty (decision-report-migration §1/§2b):
 *  - The bands come from genre NORMS (genre-norms.ts), not a measured released-
 *    track corpus — every axis is flagged `estimated: true` until that corpus
 *    exists. The view labels them as estimated.
 *  - No fabricated percentile is produced here; the verdict is driven by the
 *    engine's verdict (measured craft), with the score only as a tiebreaker.
 *  - Axes are only emitted for dimensions we actually measured — an absent
 *    measurement produces no axis (no invented data).
 */

import type { AudioFeatures } from "@/lib/audio-analysis";
import { genreNorms } from "@/lib/genre-norms";
import type { GeneratedReport, ScoreVerdict } from "@/lib/score-report-ai";
import type { ReleaseAxis, Blocker } from "@/components/score/verdict-types";

/** Toggle (defaults on): gate verdict-payload generation. Mirrors the
 *  FREE_FULL_READ const pattern — flip to false to stop writing releaseBar
 *  (existing + new reports then render the legacy ReportView). */
export const VERDICT_REPORT =
  process.env.VERDICT_REPORT !== "0" && process.env.VERDICT_REPORT !== "false";

export type VerdictPayloadResult = {
  verdict: ScoreVerdict;
  releaseBar: ReleaseAxis[];
  blockers: Blocker[];
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Which side(s) of the band are genuinely release-blocking when exceeded.
 *  Several axes are only bad in ONE direction: a master can be too squashed
 *  (bad) but never "too dynamic" (that's upside); a sparse arrangement can be
 *  lighter on low end than a full mix without that being a reason it gets
 *  passed on. An axis outside the band on a non-blocking side reads "edge"
 *  (worth a note) — never "out" (a verdict-capping blocker). */
type BlockingSide = "both" | "low" | "high";

/** Place a measured value on a 0-100 axis given the band's [lo,hi] real range,
 *  with `pad` of headroom either side so an in-band value sits inside the shaded
 *  zone and an out-of-band value reads visibly outside it. `blocks` says which
 *  direction(s) actually block release — the other side caps out at "edge". */
function placeOnAxis(
  value: number,
  bandLo: number,
  bandHi: number,
  axisLo: number,
  axisHi: number,
  blocks: BlockingSide = "both"
): { pos: number; status: ReleaseAxis["status"] } {
  const span = axisHi - axisLo || 1;
  const pos = clamp(((value - axisLo) / span) * 100, 2, 98);
  const margin = (bandHi - bandLo) * 0.15;
  let status: ReleaseAxis["status"];
  if (value >= bandLo && value <= bandHi) {
    status = "in";
  } else {
    const side: "low" | "high" = value < bandLo ? "low" : "high";
    const hard = value < bandLo - margin || value > bandHi + margin;
    const blocking = blocks === "both" || blocks === side;
    // Hard-outside on a blocking side is a real release blocker; anything else
    // outside the band (soft margin, or the non-blocking direction) is "edge".
    status = hard && blocking ? "out" : "edge";
  }
  return { pos: Math.round(pos), status };
}

function bandToZone(
  bandLo: number,
  bandHi: number,
  axisLo: number,
  axisHi: number
): [number, number] {
  const span = axisHi - axisLo || 1;
  return [
    Math.round(clamp(((bandLo - axisLo) / span) * 100, 0, 100)),
    Math.round(clamp(((bandHi - axisLo) / span) * 100, 0, 100)),
  ];
}

/**
 * Build the release-bar axes from real measured features. Each axis is only
 * emitted when its underlying measurement exists. Bands are genre norms →
 * `estimated: true`.
 */
export function buildReleaseBar(
  features: AudioFeatures | null,
  genre: string | null | undefined,
  opts?: { hookApplies?: boolean }
): ReleaseAxis[] {
  if (!features) return [];
  // A "time to hook" clock is meaningless for music that isn't reaching for a
  // hook (ambient, experimental, an interlude). Default true so song/instrumental
  // tracks — and any path with no listen evidence — behave exactly as before.
  const hookApplies = opts?.hookApplies !== false;
  const nm = genreNorms(genre);
  const axes: ReleaseAxis[] = [];

  // ── master loudness (RMS dBFS) ──
  if (features.loudnessLufs != null) {
    const [lo, hi] = nm.rmsDb;
    const axisLo = lo - 6;
    const axisHi = hi + 6;
    const { pos, status } = placeOnAxis(features.loudnessLufs, lo, hi, axisLo, axisHi);
    axes.push({
      label: "master loudness",
      measured: `${r1(features.loudnessLufs)} dB`,
      band: `${lo} to ${hi} dB`,
      ends: ["quieter", "louder"],
      zone: bandToZone(lo, hi, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? "loud enough to compete without crushing the master."
          : status === "edge"
            ? "close to the genre's release window — a small move lands it."
            : features.loudnessLufs < lo
              ? "quieter than released tracks here — reads as an unmastered bounce."
              : "pushed past the genre's ceiling — likely paying for it in squash.",
    });
  }

  // ── dynamic range / crest ──
  const crest = (features as { crestDb?: number }).crestDb ?? features.dynamicRange;
  if (crest != null) {
    const [lo, hi] = nm.crestDb;
    const axisLo = Math.max(0, lo - 5);
    const axisHi = hi + 5;
    // Only the squashed (low) side blocks release — being MORE dynamic than the
    // genre ceiling is upside (a live solo, an acoustic take), not a fault.
    const { pos, status } = placeOnAxis(crest, lo, hi, axisLo, axisHi, "low");
    axes.push({
      label: "dynamic range",
      measured: `${r1(crest)} dB`,
      band: `${lo} to ${hi} dB`,
      ends: ["flatter", "punchier"],
      zone: bandToZone(lo, hi, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? "it breathes — not a wall of limiter."
          : crest < lo
            ? "squashed flatter than released tracks in the genre."
            : "wider than the genre's release window — reads as dynamic, not a fault. only worth flattening if it feels unfinished next to released tracks.",
    });
  }

  // ── time to hook (intro lift) ──
  if (features.introLiftSec != null && hookApplies) {
    const [median, long] = nm.introLiftSec;
    // The genre long-side is a streaming-era yardstick (hook fast or lose them)
    // that doesn't fit long-form music — a 7-minute track earns a longer runway
    // than a 3-minute single. Scale the release window with the track's own
    // length: a hook inside roughly the first quarter of the song is structural,
    // not a release blocker (Comfortably Numb's 1:43 intro on a ~7-min track is
    // the form, not a fault). Short tracks fall back to the genre long-side.
    const trackLen = features.sourceDurationSec ?? features.durationSec ?? null;
    const effLong = trackLen ? Math.max(long, Math.round(0.25 * trackLen)) : long;
    const axisLo = 0;
    const axisHi = effLong + 30;
    // The "release band" runs from 0 up to that length-aware long-side; only
    // landing the hook LATE blocks release — arriving early never does.
    const { pos, status } = placeOnAxis(features.introLiftSec, 0, effLong, axisLo, axisHi, "high");
    axes.push({
      label: "time to hook",
      measured: mmss(features.introLiftSec),
      band: `0:00 to ${mmss(effLong)}`,
      ends: ["earlier", "later"],
      zone: bandToZone(0, effLong, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? `gets moving inside the window for a track this length (genre median ~${mmss(median)}).`
          : `released tracks this length land it by ~${mmss(effLong)} — yours waits longer, so the first listen risks drifting first.`,
    });
  }

  // ── low-end balance (share of spectrum) ──
  if (features.spectral) {
    const lowEnd = features.spectral.sub + features.spectral.bass;
    // Healthy low-end share sits roughly 0.30–0.55 of the spectrum across genres.
    const lo = 0.3;
    const hi = 0.55;
    const axisLo = 0;
    const axisHi = 0.85;
    // Only a heavy/muddy low end (high side) blocks release — a light low end is
    // usually instrumentation (a guitar-and-drums take, an acoustic song), not a
    // fault that gets a track passed on.
    const { pos, status } = placeOnAxis(lowEnd, lo, hi, axisLo, axisHi, "high");
    axes.push({
      label: "low-end balance",
      measured: `${Math.round(lowEnd * 100)}% of spectrum`,
      band: `${Math.round(lo * 100)}–${Math.round(hi * 100)}%`,
      ends: ["lighter", "heavier"],
      zone: bandToZone(lo, hi, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? "low end sits where released tracks tend to."
          : lowEnd > hi
            ? "heavier low end than the genre median — worth a check on bigger systems."
            : "lighter low end than released tracks — often just the instrumentation (no bass instrument), not a fault. add weight underneath only if it feels thin.",
    });
  }

  return axes;
}

/**
 * Decide the verdict. Leads with the engine's measured verdict; nudges DOWN a
 * rung if the release bar found a hard out-of-band blocker (so an "ALMOST_THERE"
 * with a real blocker doesn't read as ready). Never nudges up — measured craft
 * caps it.
 */
export function deriveVerdict(
  generated: Pick<GeneratedReport, "verdict" | "score">,
  releaseBar: ReleaseAxis[]
): ScoreVerdict {
  const order: ScoreVerdict[] = ["NOT_READY", "NEEDS_WORK", "ALMOST_THERE", "RELEASE_READY"];
  let idx = order.indexOf(generated.verdict);
  if (idx < 0) idx = 1;
  const outOfBand = releaseBar.filter((a) => a.status === "out").length;
  // A release-ready call with a measured blocker is at most "almost there".
  if (outOfBand > 0 && idx >= 3) idx = 2;
  // Two+ hard blockers can't be "almost there" either.
  if (outOfBand >= 2 && idx >= 2) idx = 1;
  return order[clamp(idx, 0, 3)];
}

// Each release-bar axis maps to a concrete fix + the keywords that mean an AI
// priority-fix is already talking about the same thing (so we don't list the
// blocker twice — once measured, once as the model's prose).
const AXIS_FIX: Record<string, { label: string; keywords: string[] }> = {
  "master loudness": {
    label: "get the master to release level",
    keywords: ["loud", "master", "level", "lufs", "volume", "quiet"],
  },
  "dynamic range": {
    label: "ease the compression back",
    keywords: ["dynamic", "compress", "limiter", "squash", "punch", "crush"],
  },
  "time to hook": {
    label: "get to the hook sooner",
    keywords: ["intro", "hook", "sooner", "front", "drop", "vocal", "trim"],
  },
  "low-end balance": {
    label: "balance the low end",
    keywords: ["low end", "low-end", "bass", "sub", "mud", "boom", "weight"],
  },
};

/**
 * Build the ranked release blockers as ONE coherent list. Measured out-of-band
 * axes come first — these are the grounded, verdict-driving blockers, so the
 * hero's "N blockers to release" count (the out-of-band axis count) always lines
 * up with the top N entries here. The model's priority fixes fill the remaining
 * slots, minus any that just restate a measured blocker.
 */
export function buildBlockers(
  generated: Pick<GeneratedReport, "priorityFixes">,
  releaseBar: ReleaseAxis[]
): Blocker[] {
  const outAxes = releaseBar.filter((a) => a.status === "out");
  const outOfBand = outAxes.length;

  // Grounded blockers from the measured bar — each carries its real number.
  const measured = outAxes.map((a) => {
    const m = AXIS_FIX[a.label];
    return {
      label: m?.label ?? a.label,
      detail: `your ${a.label} measured ${a.measured} against a release window of ${a.band} — ${a.note}`,
      keywords: m?.keywords ?? [],
    };
  });
  const usedKeywords = measured.flatMap((m) => m.keywords);

  // AI fixes, most-flagged first, dropping any that just restate a measured one.
  const aiFixes = [...generated.priorityFixes]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .filter((f) => {
      const hay = `${f.label} ${f.detail}`.toLowerCase();
      return !usedKeywords.some((k) => hay.includes(k));
    })
    .map((f) => ({ label: f.label, detail: f.detail }));

  const combined = [...measured, ...aiFixes].slice(0, 3);

  return combined.map((b, i) => ({
    rank: i + 1,
    weight: weightFor(i, combined.length, outOfBand),
    label: b.label,
    detail: b.detail,
  }));
}

/** Weight label by position: the first `outOfBand` items are real release
 *  blockers; everything after is pre-ship polish. */
function weightFor(i: number, total: number, outOfBand: number): string {
  if (i < outOfBand) return i === 0 ? "the one that's holding the verdict" : "also blocking release";
  if (i === 0) return "worth doing before you ship";
  if (i === total - 1) return "polish, not a blocker";
  return "worth doing before you ship";
}

/** Build the full verdict payload, or null when there's nothing to ground it. */
export function buildVerdictPayload(
  generated: GeneratedReport,
  features: AudioFeatures | null,
  genre: string | null | undefined
): VerdictPayloadResult | null {
  if (!VERDICT_REPORT) return null;
  // The listen pass (persisted in evidence) knows whether this track reaches for a
  // hook at all — gate the time-to-hook axis on it. Absent (v1 / no listen) → the
  // axis is emitted as before.
  const listen = generated.evidence?.listen ?? null;
  const hookApplies = listen ? listen.hasHookAmbition : true;
  const releaseBar = buildReleaseBar(features, genre, { hookApplies });
  // No measured axes → nothing honest to show on the bar; skip the verdict layout
  // and let the report fall back to the legacy view.
  if (releaseBar.length === 0) return null;
  return {
    verdict: deriveVerdict(generated, releaseBar),
    releaseBar,
    blockers: buildBlockers(generated, releaseBar),
  };
}
