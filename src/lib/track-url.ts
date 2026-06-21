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
 * Hosts whose links *look* like a file (often ending in .mp3) but actually serve
 * an HTML preview/landing page — so the analyzer pulls markup, not audio, and the
 * report comes back ungrounded (no waveform, "Untitled"). We block these up front
 * and tell the user why instead of generating a junk report. Mapped to a friendly
 * label for the message. (Dropbox's real CDN, dropboxusercontent.com, is NOT here
 * — that one serves the actual bytes and analyses fine.)
 */
const PREVIEW_ONLY_HOSTS: Record<string, string> = {
  "dropbox.com": "dropbox",
  "drive.google.com": "google drive",
  "docs.google.com": "google drive",
  "wetransfer.com": "wetransfer",
  "we.tl": "wetransfer",
  "box.com": "box",
  "onedrive.live.com": "onedrive",
  "1drv.ms": "onedrive",
};

function previewOnlyLabel(host: string): string | null {
  for (const domain in PREVIEW_ONLY_HOSTS) {
    if (host === domain || host.endsWith(`.${domain}`)) return PREVIEW_ONLY_HOSTS[domain];
  }
  return null;
}

/**
 * A specific, human reason a link can't be used — currently the preview-page
 * hosts above. null means "no special reason" (fall back to SUPPORTED_TRACK_HINT).
 */
export function unsupportedReason(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(normalizeTrackUrl(raw));
  } catch {
    return null;
  }
  const label = previewOnlyLabel(url.hostname.toLowerCase());
  if (!label) return null;
  return `${label} links don't work here — they open a preview page, not the file. paste a soundcloud, youtube or bandcamp link, or a direct mp3.`;
}

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
  // Preview-page hosts (Dropbox share links, Google Drive, …) masquerade as
  // direct files — reject before the audio-extension check below catches them.
  if (previewOnlyLabel(host)) return false;
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
