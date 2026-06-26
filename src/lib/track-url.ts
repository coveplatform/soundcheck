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
 * SoundCloud "private share" links carry a secret token — either a trailing
 * /s-<token> path segment or a ?secret_token=<token> query param. They open fine
 * for the owner (they're signed in, or the browser honors the token), but
 * SoundCloud's embed widget refuses to play them inside our reviewer iframe, so
 * reviewers get a dead player and flag the track "unplayable". Block them up
 * front and tell the artist to make the track public.
 *
 * The token is always the final path segment, appended after the full
 * user/track (or user/sets/playlist) path — so we only treat /s-… as a token
 * when there are at least 3 segments, never on a 2-segment public track whose
 * slug happens to start with "s-".
 */
export const PRIVATE_SOUNDCLOUD_REASON =
  "That's a private SoundCloud link — reviewers can't play it in our player. On SoundCloud, set the track to Public, then paste the public link.";

export function isPrivateSoundcloudUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(normalizeTrackUrl(raw));
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (host !== "soundcloud.com" && !host.endsWith(".soundcloud.com")) return false;

  if (url.searchParams.has("secret_token")) return true;

  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return segments.length >= 3 && /^s-[A-Za-z0-9]+$/.test(last);
}

/**
 * A specific, human reason a link can't be used — preview-page hosts above and
 * private SoundCloud share links. null means "no special reason" (fall back to
 * SUPPORTED_TRACK_HINT).
 */
export function unsupportedReason(raw: string): string | null {
  if (isPrivateSoundcloudUrl(raw)) return PRIVATE_SOUNDCLOUD_REASON.toLowerCase();
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

  if (isOrSub("soundcloud.com") || host === "snd.sc") {
    // Private share links (…/s-<token>) play for the owner but die in the
    // reviewer-side embed widget — keep them out of the pipeline.
    if (isPrivateSoundcloudUrl(raw)) return false;
    return hasPath;
  }
  if (isOrSub("youtube.com") || host === "youtu.be") {
    return hasPath || url.searchParams.has("v");
  }
  if (isOrSub("bandcamp.com")) return hasPath;

  // Direct audio links (any host) — includes our own uploads bucket.
  return AUDIO_EXT_RE.test(url.pathname);
}
