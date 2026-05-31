// Hosts allowed for next/image — must mirror `images.remotePatterns` in
// next.config.ts. Artwork from any other host (e.g. SoundCloud's
// `soundcloud.com/images/fb_placeholder.png` no-art fallback) makes next/image
// throw "hostname not configured", which crashes the whole server render.
const ALLOWED_IMG_HOSTS = new Set([
  "i.ytimg.com",
  "i1.sndcdn.com",
  "f4.bcbits.com",
  "images.unsplash.com",
  "picsum.photos",
  "fastly.picsum.photos",
  "d1gm7q4p33g3v8.cloudfront.net",
]);

/**
 * Returns the artwork URL only if next/image can safely render it; otherwise
 * null so callers fall back to a placeholder instead of crashing the render.
 */
export function safeArtwork(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return ALLOWED_IMG_HOSTS.has(new URL(url).hostname) ? url : null;
  } catch {
    return null;
  }
}
