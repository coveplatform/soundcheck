import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch public track with limited fields
    const track = await prisma.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        sourceUrl: true,
        sourceType: true,
        viewCount: true,
        isPublic: true,
        ArtistProfile: {
          select: {
            artistName: true,
          },
        },
        Genre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Track not found
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Track is not public
    if (!track.isPublic) {
      return NextResponse.json(
        { error: "Track is not public" },
        { status: 403 }
      );
    }

    return NextResponse.json(track, { status: 200 });
  } catch (error) {
    console.error("Error fetching public track:", error);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}
