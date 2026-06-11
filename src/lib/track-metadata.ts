/**
 * Lightweight oEmbed lookup for a track URL → { title, artist }.
 *
 * Used to enrich the score report's AI input: handing the model the real title +
 * artist lets its knowledge of released/known music inform the read, instead of
 * scoring a "(untitled)" blob blind. Degrades to null on any failure.
 */
export type TrackMeta = {
  title: string | null;
  artist: string | null;
  artworkUrl: string | null;
};

/** The oEmbed endpoint for a URL, or null when the host has none. Exported as
 * a capability check: on these hosts a null oEmbed result means the track
 * itself doesn't resolve (deleted/private/wrong link), not "host unsupported". */
export function oembedUrlFor(url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (hostname.includes("soundcloud.com")) {
    return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  }
  if (hostname.includes("bandcamp.com")) {
    return `https://bandcamp.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  }
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  }
  return null;
}

export async function fetchTrackMeta(url: string): Promise<TrackMeta | null> {
  const oembedUrl = oembedUrlFor(url);
  if (!oembedUrl) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      title: data.title?.trim() || null,
      artist: data.author_name?.trim() || null,
      artworkUrl: data.thumbnail_url?.trim() || null,
    };
  } catch {
    return null;
  }
}
