import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    // Get reviewer profile
    const reviewer = await prisma.listenerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    // Get track
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        sourceType: true,
        allowPurchase: true,
        artist: {
          select: {
            artistName: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    // Verify track is an upload
    if (track.sourceType !== "UPLOAD") {
      return NextResponse.json(
        { error: "Only uploaded tracks can be downloaded" },
        { status: 400 }
      );
    }

    // Verify purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: {
        trackId_reviewerId: {
          trackId: track.id,
          reviewerId: reviewer.id,
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "You must purchase this track before downloading" },
        { status: 403 }
      );
    }

    // Return download info
    // The sourceUrl is the public URL to the file
    return NextResponse.json({
      downloadUrl: track.sourceUrl,
      filename: `${track.artist.artistName} - ${track.title}.mp3`,
    });
  } catch (error) {
    console.error("Error getting download:", error);
    return NextResponse.json(
      { error: "Failed to get download" },
      { status: 500 }
    );
  }
}
