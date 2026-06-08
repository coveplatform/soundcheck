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

export async function fetchTrackMeta(url: string): Promise<TrackMeta | null> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  let oembedUrl: string | null = null;
  if (hostname.includes("soundcloud.com")) {
    oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  } else if (hostname.includes("bandcamp.com")) {
    oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  }
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
