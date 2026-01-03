import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = requestSchema.parse(body);

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

    // Fetch metadata from oEmbed API
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch track metadata" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      title: data.title || "Untitled Track",
      artworkUrl: data.thumbnail_url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    console.error("Error fetching metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
