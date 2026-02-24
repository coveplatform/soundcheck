import { NextResponse } from "next/server";
import { z } from "zod";

// Fallback for when Bandcamp oEmbed returns HTML instead of JSON.
// Fetches the track page and extracts the embed track ID from the HTML.
async function fetchBandcampEmbedFromPage(
  url: string
): Promise<{ title: string; artworkUrl?: string; embedUrl?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();

    // Extract track ID — try several patterns Bandcamp uses
    let trackId: string | undefined;

    // 1. data-tralbum attribute (HTML-entity-encoded JSON) — most reliable
    const tralbumMatch = html.match(/data-tralbum="([^"]+)"/);
    if (tralbumMatch) {
      try {
        const decoded = tralbumMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
        const obj = JSON.parse(decoded) as { id?: number; current?: { id?: number } };
        const id = obj.id ?? obj.current?.id;
        if (id) trackId = String(id);
      } catch { /* ignore */ }
    }

    // 2. Fallback inline patterns
    if (!trackId) {
      const idMatch =
        html.match(/data-item-id="(\d+)"/) ||
        html.match(/"item_id"\s*:\s*(\d+)/) ||
        html.match(/\/EmbeddedPlayer\/track=(\d+)/);
      trackId = idMatch?.[1];
    }

    // Extract title from og:title meta tag
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : "Untitled Track";

    // Extract artwork from og:image
    const artMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const artworkUrl = artMatch?.[1];

    const embedUrl = trackId
      ? `https://bandcamp.com/EmbeddedPlayer/track=${trackId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`
      : undefined;

    return { title, artworkUrl, embedUrl };
  } catch {
    return null;
  }
}

const requestSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  let requestUrl: string | undefined;

  try {
    const body = await request.json();
    const { url } = requestSchema.parse(body);
    requestUrl = url;

    // Detect source
    const hostname = new URL(url).hostname.toLowerCase();
    let oembedUrl: string | null = null;

    if (hostname.includes("soundcloud.com")) {
      oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (hostname.includes("bandcamp.com")) {
      oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (hostname.includes("spotify.com")) {
      oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    }

    if (!oembedUrl) {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

    // Fetch metadata from oEmbed API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // For Bandcamp, oEmbed failures are common — fall back to page scraping
      if (hostname.includes("bandcamp.com")) {
        const fallback = await fetchBandcampEmbedFromPage(url);
        if (fallback) {
          return NextResponse.json(fallback);
        }
      }
      console.error(`oEmbed fetch failed for ${hostname}:`, {
        url,
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json(
        { error: "Failed to fetch track metadata" },
        { status: response.status }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      // oEmbed returned non-JSON (Bandcamp sometimes returns HTML instead).
      // Fall back to scraping the track page for the embed track ID.
      if (hostname.includes("bandcamp.com")) {
        const fallback = await fetchBandcampEmbedFromPage(url);
        if (fallback) {
          return NextResponse.json(fallback);
        }
      }
      return NextResponse.json(
        { error: "Failed to parse track metadata" },
        { status: 502 }
      );
    }

    // For Bandcamp, extract the iframe src from the HTML
    let embedUrl: string | undefined;
    if (hostname.includes("bandcamp.com") && data.html) {
      const srcMatch = (data.html as string).match(/src="([^"]+)"/);
      embedUrl = srcMatch?.[1] || undefined;
    }

    return NextResponse.json({
      title: data.title || "Untitled Track",
      artworkUrl: data.thumbnail_url,
      embedUrl, // Include embed URL for Bandcamp
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Log detailed error information for debugging
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("Error fetching metadata:", {
      error: errorName,
      message: errorMessage,
      url: requestUrl,
    });

    // Check if it's a timeout error
    if (errorName === 'AbortError') {
      return NextResponse.json(
        { error: "Request timed out - the track link may be slow or invalid" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
