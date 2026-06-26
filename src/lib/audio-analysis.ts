/**
 * Audio acquisition + feature extraction for grounded AI feedback.
 *
 * The LLM can't hear audio, so we measure the track with real DSP and feed it
 * the numbers. Getting the audio from a URL is the hard part:
 *
 *   1. Spotify link  → Spotify Audio Features API (no download; released tracks
 *                      only; requires SPOTIFY_CLIENT_ID/SECRET; restricted for
 *                      new apps).
 *   2. SoundCloud / YouTube link → an external extraction worker (yt-dlp +
 *                      ffmpeg + analysis) reachable at AUDIO_WORKER_URL. Can't
 *                      run in serverless, so it lives as its own service.
 *   3. Uploaded file → posted to the same worker for analysis.
 *
 * Everything degrades gracefully: if no source is available we return null and
 * the report falls back to a non-grounded (more cautious) read.
 */

export type AudioFeatures = {
  source: "spotify" | "worker";
  durationSec?: number;
  /** Set when the worker's analysis window truncated a longer track: the FULL
   * source length (durationSec is then just the analysed span). */
  sourceDurationSec?: number;
  tempo?: number; // BPM
  key?: string; // e.g. "F# minor"
  /** Integrated loudness, LUFS (e.g. -9.2). */
  loudnessLufs?: number;
  /** Loudness range / dynamic range in dB. Low = squashed. */
  dynamicRange?: number;
  /** Overall energy 0-1. */
  energy?: number;
  /** Share of energy per band, 0-1 each (roughly sums to 1). */
  spectral?: {
    sub: number;
    bass: number;
    lowMid: number;
    mid: number;
    high: number;
  };
  /** Seconds until the first significant energy lift (intro length proxy). */
  introLiftSec?: number;
  /** Notable energy dips — where attention likely drifts. */
  energyDips?: { startSec: number; endSec: number; dropDb: number }[];
  /** The track's arrangement: intro / build / drop / breakdown / outro spans. */
  sections?: { kind: string; startSec: number; endSec: number }[];
  /** Rough 0-1 proxy for how present vocals are across the track. */
  vocalPresence?: number;
  /** True when the deep (stem-separation) pass ran for this analysis. */
  stemsUsed?: boolean;
  /** Per-stem balance from demucs/Replicate (present when the stem pass ran). */
  stemMix?: {
    drums?: number;
    bass?: number;
    vocals?: number;
    /** >1 = vocal sits above the rhythm section; <1 = tucked under it. */
    vocalVsInstruments?: number;
  };
  /** Link-independent acoustic identity — for re-upload / version detection. */
  fingerprint?: AcousticFingerprint;
  /** Compact 3-band waveform for the report page (worker `_report_waveform`):
   * per-column LOW/MID/HIGH peaks + RMS body, base64 uint8, ~1200 columns. */
  waveform?: { n: number; lo: string; mid: string; hi: string; amp: string };
  /** Confidence of the detected beatgrid ("high" | "low"). */
  gridConfidence?: string;
  /** Crest factor (peak − RMS, dB) — low = squashed master. Worker rev excerpt-1+. */
  crestDb?: number;
  /** Base64 mp3 of the track's opening (~90s) for the listen pass. NEVER
   * persisted — consumed by the score engine and dropped. Worker rev excerpt-1+. */
  excerpt?: { b64: string; format?: string; durationSec?: number };
  /** Anything extra the worker returns. */
  extra?: Record<string, unknown>;
};

/** The worker refused the source: longer than the product cap (a DJ set, full
 * album or podcast — not a single track). Carries the measured length so the
 * UI can say how long it actually was. */
export type TooLongResult = { tooLong: true; sourceDurationSec?: number };

/** Compact descriptor the worker derives so we can recognise the same song
 * across different links / re-encodes (see worker `_acoustic_fingerprint`). */
export type AcousticFingerprint = {
  durationSec?: number;
  tempo?: number;
  key?: string;
  spectral?: { sub: number; bass: number; lowMid: number; mid: number; high: number };
  energy?: number;
  /** Section start times normalised by duration (the arrangement "shape"). */
  sectionBounds?: number[];
};

function detectSpotify(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes("spotify.com");
  } catch {
    return false;
  }
}

function spotifyTrackId(url: string): string | null {
  const m = url.match(/track\/([a-zA-Z0-9]+)/);
  return m?.[1] ?? null;
}

// ── Spotify Audio Features ──────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.token;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return cachedToken.token;
  } catch {
    return null;
  }
}

async function spotifyFeatures(url: string): Promise<AudioFeatures | null> {
  const trackId = spotifyTrackId(url);
  if (!trackId) return null;
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/audio-features/${trackId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null; // 403 = endpoint restricted for this app
    const f = (await res.json()) as Record<string, number>;

    const PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const key =
      f.key >= 0
        ? `${PITCHES[f.key] ?? "?"} ${f.mode === 1 ? "major" : "minor"}`
        : undefined;

    return {
      source: "spotify",
      durationSec: f.duration_ms ? Math.round(f.duration_ms / 1000) : undefined,
      tempo: f.tempo ? Math.round(f.tempo) : undefined,
      key,
      loudnessLufs: f.loudness, // dBFS-ish, close enough to feed the model
      energy: f.energy,
      extra: {
        danceability: f.danceability,
        valence: f.valence,
        acousticness: f.acousticness,
        instrumentalness: f.instrumentalness,
        speechiness: f.speechiness,
      },
    };
  } catch {
    return null;
  }
}

// ── Extraction worker (SoundCloud / YouTube / direct files) ─────────

async function workerFeatures(
  url: string,
  deep = false,
  timeoutMs?: number
): Promise<AudioFeatures | TooLongResult | null> {
  const workerUrl = process.env.AUDIO_WORKER_URL;
  if (!workerUrl) {
    console.warn("[audio-analysis] AUDIO_WORKER_URL not set — read will be ungrounded");
    return null;
  }

  try {
    const controller = new AbortController();
    // Budgets sized to the worker's real phases inside our 300s function cap:
    // shallow = download + queue wait (≤45s) + local DSP (~60s); deep adds the
    // bounded Replicate stem window (REPLICATE_TIMEOUT_SECS=150 on the worker).
    // The old 180s deep ceiling sat BELOW a routine successful deep read
    // (196.5s observed) — we paid for analyses and then aborted them.
    // `timeoutMs` overrides for callers on a tighter budget (the burst retry).
    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs ?? (deep ? 240_000 : 150_000)
    );
    const res = await fetch(`${workerUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AUDIO_WORKER_SECRET
          ? { Authorization: `Bearer ${process.env.AUDIO_WORKER_SECRET}` }
          : {}),
      },
      body: JSON.stringify({ url, deep }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[audio-analysis] worker /analyze HTTP ${res.status} (deep=${deep}) for ${url}`);
      return null;
    }
    // The worker replies with a `{ features }` envelope; null = "couldn't ground
    // this track" (bad link, download blocked) → fall back to the non-grounded read.
    const data = (await res.json()) as {
      features?: Partial<AudioFeatures> | null;
      tooLong?: boolean;
      sourceDurationSec?: number;
    };
    // Product cap (worker MAX_SOURCE_SECS): the source isn't a single track.
    // Distinct from a failure — the caller writes an honest "too long" result
    // instead of falling back to a metadata-only score.
    if (data.tooLong) {
      console.warn(
        `[audio-analysis] worker refused over-cap source (${data.sourceDurationSec ?? "?"}s) for ${url}`
      );
      return { tooLong: true, sourceDurationSec: data.sourceDurationSec };
    }
    if (!data.features) {
      console.warn(`[audio-analysis] worker returned null features (deep=${deep}) for ${url}`);
      return null;
    }
    return { source: "worker", ...data.features } as AudioFeatures;
  } catch (err) {
    console.warn(
      `[audio-analysis] worker fetch failed (deep=${deep}) for ${url}:`,
      err instanceof Error ? `${err.name}: ${err.message}` : err
    );
    return null;
  }
}

/**
 * Try every available path to get real audio features for a track URL.
 * Returns null when nothing is configured/available (report stays non-grounded).
 */
export async function acquireAudioFeatures(
  url: string,
  opts: { deep?: boolean; timeoutMs?: number } = {}
): Promise<AudioFeatures | TooLongResult | null> {
  if (detectSpotify(url)) {
    const sf = await spotifyFeatures(url);
    if (sf) return sf;
  }
  // SoundCloud / YouTube / Bandcamp / direct → extraction worker. `deep` runs
  // the stem-separation pass — score reports request it for ALL reads now
  // (instant included); the paid gate is the deep prose, not the analysis.
  const feat = await workerFeatures(url, opts.deep ?? false, opts.timeoutMs);
  if (feat || !opts.deep) return feat;
  // Stems ride Replicate, and a cold start there can blow the whole budget.
  // Stems are an upgrade, not a dependency — retry without them so the read
  // still gets grounded (sections, waveform, fingerprint) instead of falling
  // all the way back to a metadata-only score. The pause matters: if the deep
  // pass died because the worker itself crashed (e.g. OOM), an instant retry
  // just hits the corpse — give the box a moment to come back.
  await new Promise((r) => setTimeout(r, 8000));
  return workerFeatures(url, false, opts.timeoutMs);
}

// Turn a 0–1 signal into a plain-language band so the model describes the feel
// rather than parroting a raw "/100" number into the read.
function band(v: number, labels: [string, string, string, string]): string {
  if (v < 0.3) return labels[0];
  if (v < 0.5) return labels[1];
  if (v < 0.75) return labels[2];
  return labels[3];
}

function mmss(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Model-friendly description of the measured audio — INTERPRETED, not raw.
 * Deliberately omits the analysed duration (it's a capped window, not the song
 * length) and never emits bare "/100" scores, so the read reads like a listener
 * instead of regurgitating telemetry.
 */
export function describeFeatures(f: AudioFeatures): string {
  const lines: string[] = [];
  // Truncated read: the worker only analysed the first N seconds of a longer
  // track. Say so explicitly — the model must never describe an ending (or a
  // total runtime) it didn't hear.
  if (f.sourceDurationSec && f.durationSec && f.sourceDurationSec > f.durationSec + 5) {
    lines.push(
      `IMPORTANT — PARTIAL ANALYSIS: only the first ${mmss(f.durationSec)} of a ${mmss(f.sourceDurationSec)} track was analysed. Everything below describes that opening span ONLY. Do NOT describe the ending, the back half, or the total runtime; do NOT treat the end of the analysed span as the end of the song.`
    );
  }
  if (f.tempo != null) lines.push(`tempo: ${Math.round(f.tempo)} BPM (${band(Math.min(1, f.tempo / 180), ["slow", "mid-tempo", "upbeat", "fast/driving"])})`);
  if (f.key) lines.push(`key: ${f.key}`);
  if (f.dynamicRange != null)
    lines.push(`dynamics: ${band(Math.min(1, f.dynamicRange / 14), ["very compressed/flat", "fairly flat", "some light and shade", "wide, dynamic"])}`);
  if (f.crestDb != null)
    lines.push(`crest factor: ${Math.round(f.crestDb * 10) / 10}dB peak-over-RMS (${band(Math.min(1, f.crestDb / 16), ["squashed / limited hard", "tight modern master", "healthy punch", "very wide — dynamic or unmastered-quiet"])})`);
  if (f.energy != null)
    lines.push(`overall energy: ${band(f.energy, ["laid-back/low", "moderate", "moderate-to-high", "high, driving"])}`);
  if (f.spectral) {
    const s = f.spectral;
    const lowEnd = s.sub + s.bass;
    lines.push(`low end: ${band(lowEnd, ["thin/light", "a touch light", "solid", "heavy/possibly boomy"])}; top end: ${band(s.high, ["dull/dark", "a little soft up top", "crisp", "bright/possibly harsh"])}`);
  }
  if (f.introLiftSec != null) {
    const longIntro = f.introLiftSec > 20;
    lines.push(`intro: ~${Math.round(f.introLiftSec)}s before the first real lift${longIntro ? " (on the long side — listeners may drift before the hook)" : ""}`);
  }
  // The separated "vocal" stem frequently captures synth leads, pads and FX on
  // electronic/instrumental tracks (a known demucs failure mode) — so we never
  // let the model assert SUNG vocals from this signal alone. It must corroborate
  // with the genre/notes, and otherwise call it "the lead".
  const vocalCaveat =
    " (CAUTION: this comes from stem separation, which often mistakes synth leads/pads for vocals on electronic or instrumental tracks — only describe it as sung vocals if the genre/artist notes support that; otherwise call it the lead/top-line element, and never invent lyrics or a singer)";
  if (f.vocalPresence != null)
    lines.push(`vocal-stem presence: ${band(f.vocalPresence, ["barely present / likely instrumental", "sitting well back in the mix", "present and clear", "upfront"])}${vocalCaveat}`);
  // Stem separation (deep reads): how the parts actually sit against each other.
  if (f.stemMix) {
    const m = f.stemMix;
    const vvi = m.vocalVsInstruments;
    const vocalSit =
      vvi == null ? null
      : vvi >= 1.15 ? "the vocal/lead stem sits clearly on top of the instruments"
      : vvi <= 0.85 ? "the vocal/lead stem is tucked under the instruments"
      : "the vocal/lead stem and instruments sit at a similar level";
    const parts: string[] = [];
    if (m.drums != null) parts.push(`drums ${band(Math.min(1, m.drums), ["soft", "moderate", "strong", "dominant"])}`);
    if (m.bass != null) parts.push(`bass ${band(Math.min(1, m.bass), ["light", "moderate", "strong", "heavy"])}`);
    lines.push(`stems (separated): ${parts.join(", ")}${vocalSit ? `; ${vocalSit}` : ""}${f.vocalPresence == null && vocalSit ? vocalCaveat : ""}`);
  }
  if (f.sections?.length) {
    lines.push(
      `arrangement: ${f.sections.map((s) => `${s.kind} (${mmss(s.startSec)}–${mmss(s.endSec)})`).join(" → ")}`
    );
  }
  if (f.energyDips?.length) {
    lines.push(
      `energy pulls back around: ${f.energyDips.map((d) => mmss(d.startSec)).join(", ")} — a pull-back can be an intentional bridge / breakdown / beat-switch (often the quiet-before-the-lift) OR a genuine sag; decide which from whether the track lifts again after, and do NOT assume it loses listeners`
    );
  }
  return lines.join("\n");
}
