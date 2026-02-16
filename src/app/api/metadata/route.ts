import { NextResponse } from "next/server";
import { z } from "zod";

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

    const data = await response.json();

    // For Bandcamp, extract the iframe src from the HTML
    let embedUrl: string | undefined;
    if (hostname.includes("bandcamp.com") && data.html) {
      const srcMatch = data.html.match(/src="([^"]+)"/);
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
