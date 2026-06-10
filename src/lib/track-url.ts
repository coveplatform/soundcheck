/**
 * Which track links we can actually pull + analyze. Shared by the paste boxes
 * (landing + /submit-score) and the score submit/start API routes so a random
 * website URL can't slip into the pipeline from any entry point.
 *
 * Supported: SoundCloud (incl. on.soundcloud.com short links), YouTube,
 * Bandcamp, and direct audio file links — which also covers our own uploads
 * bucket (UPLOADS_PUBLIC_BASE_URL/tracks/<id>.mp3).
 */

const AUDIO_EXT_RE = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

export const SUPPORTED_TRACK_HINT =
  "paste a soundcloud, youtube, bandcamp or direct mp3 link";

/**
 * Links pasted without a protocol ("soundcloud.com/artist/track",
 * "www.youtube.com/watch?v=…") get https:// prepended so they validate and
 * fetch like a full URL. Anything that doesn't look like a domain is returned
 * unchanged.
 */
export function normalizeTrackUrl(raw: string): string {
  const t = raw.trim();
  if (!t || /^https?:\/\//i.test(t)) return t;
  if (/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(t)) return `https://${t}`;
  return t;
}

export function isSupportedTrackUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(normalizeTrackUrl(raw));
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  const isOrSub = (domain: string) =>
    host === domain || host.endsWith(`.${domain}`);
  // A real track link always has a path (bare homepages don't point at audio).
  const hasPath = url.pathname.length > 1;

  if (isOrSub("soundcloud.com") || host === "snd.sc") return hasPath;
  if (isOrSub("youtube.com") || host === "youtu.be") {
    return hasPath || url.searchParams.has("v");
  }
  if (isOrSub("bandcamp.com")) return hasPath;

  // Direct audio links (any host) — includes our own uploads bucket.
  return AUDIO_EXT_RE.test(url.pathname);
}
