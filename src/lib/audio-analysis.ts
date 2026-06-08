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
  /** Confidence of the detected beatgrid ("high" | "low"). */
  gridConfidence?: string;
  /** Anything extra the worker returns. */
  extra?: Record<string, unknown>;
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

async function workerFeatures(url: string): Promise<AudioFeatures | null> {
  const workerUrl = process.env.AUDIO_WORKER_URL;
  if (!workerUrl) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(`${workerUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AUDIO_WORKER_SECRET
          ? { Authorization: `Bearer ${process.env.AUDIO_WORKER_SECRET}` }
          : {}),
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    // The worker replies with a `{ features }` envelope; null = "couldn't ground
    // this track" (bad link, download blocked) → fall back to the non-grounded read.
    const data = (await res.json()) as { features?: Partial<AudioFeatures> | null };
    if (!data.features) return null;
    return { source: "worker", ...data.features } as AudioFeatures;
  } catch {
    return null;
  }
}

/**
 * Try every available path to get real audio features for a track URL.
 * Returns null when nothing is configured/available (report stays non-grounded).
 */
export async function acquireAudioFeatures(
  url: string
): Promise<AudioFeatures | null> {
  if (detectSpotify(url)) {
    const sf = await spotifyFeatures(url);
    if (sf) return sf;
  }
  // SoundCloud / YouTube / Bandcamp / direct → extraction worker
  return workerFeatures(url);
}

/** Compact, model-friendly description of the measured audio. */
export function describeFeatures(f: AudioFeatures): string {
  const lines: string[] = [];
  if (f.durationSec != null) lines.push(`duration: ${f.durationSec}s`);
  if (f.tempo != null) lines.push(`tempo: ${f.tempo} BPM`);
  if (f.key) lines.push(`key: ${f.key}`);
  if (f.loudnessLufs != null) lines.push(`integrated loudness: ${f.loudnessLufs} LUFS`);
  if (f.dynamicRange != null) lines.push(`dynamic range: ${f.dynamicRange} dB`);
  if (f.energy != null) lines.push(`overall energy: ${(f.energy * 100).toFixed(0)}/100`);
  if (f.spectral) {
    const s = f.spectral;
    lines.push(
      `spectral balance — sub ${(s.sub * 100).toFixed(0)}%, bass ${(s.bass * 100).toFixed(0)}%, low-mid ${(s.lowMid * 100).toFixed(0)}%, mid ${(s.mid * 100).toFixed(0)}%, high ${(s.high * 100).toFixed(0)}%`
    );
  }
  if (f.introLiftSec != null)
    lines.push(`first energy lift at: ${f.introLiftSec}s (intro length)`);
  if (f.vocalPresence != null)
    lines.push(`vocal presence: ${(f.vocalPresence * 100).toFixed(0)}/100`);
  if (f.sections?.length) {
    lines.push(
      `arrangement: ${f.sections
        .map((s) => `${s.kind} ${s.startSec}-${s.endSec}s`)
        .join(" → ")}`
    );
  }
  if (f.energyDips?.length) {
    lines.push(
      `energy dips (where attention likely drops): ${f.energyDips
        .map((d) => `${d.startSec}-${d.endSec}s (-${d.dropDb}dB)`)
        .join(", ")}`
    );
  }
  if (f.gridConfidence) lines.push(`beat grid confidence: ${f.gridConfidence}`);
  if (f.extra) {
    for (const [k, v] of Object.entries(f.extra)) {
      if (typeof v === "number") lines.push(`${k}: ${v.toFixed(2)}`);
    }
  }
  return lines.join("\n");
}
