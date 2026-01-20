import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the track and check if it's public
    const track = await prisma.track.findUnique({
      where: { id },
      select: { id: true, isPublic: true },
    });

    // Track not found
    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    // Track is not public - don't track views
    if (!track.isPublic) {
      return NextResponse.json(
        { error: "Track is not public" },
        { status: 403 }
      );
    }

    // Increment view count and update last viewed timestamp
    await prisma.track.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
