import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charts/my-tracks
 * Returns the current user's tracks that are eligible for chart submission.
 * A track is eligible if it has a sourceUrl (any status except CANCELLED).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      return NextResponse.json({ tracks: [] });
    }

    // Get today's chart date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if user already submitted today
    const existingSubmission = await (prisma as any).chartSubmission.findFirst({
      where: {
        artistId: artistProfile.id,
        chartDate: today,
      },
      select: { id: true, trackId: true },
    });

    const tracks = await prisma.track.findMany({
      where: {
        artistId: artistProfile.id,
        status: { not: "CANCELLED" },
        sourceUrl: { not: "" },
      },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        sourceUrl: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      tracks,
      alreadySubmittedToday: !!existingSubmission,
      submittedTrackId: existingSubmission?.trackId || null,
    });
  } catch (err: any) {
    console.error("Chart my-tracks error:", err);
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
  }
}
