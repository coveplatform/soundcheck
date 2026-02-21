import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        subscriptionStatus: true,
        reviewCredits: true,
      },
    });

    if (!artistProfile) {
      return NextResponse.json({ error: "No artist profile" }, { status: 404 });
    }

    const isPro = artistProfile.subscriptionStatus === "active";
    const maxSlots = getMaxSlots(isPro);

    const activeTracks = await prisma.track.findMany({
      where: {
        artistId: artistProfile.id,
        status: { in: [...ACTIVE_TRACK_STATUSES] },
      },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        status: true,
        reviewsRequested: true,
        reviewsCompleted: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      isPro,
      maxSlots,
      activeCount: activeTracks.length,
      activeTracks,
      credits: artistProfile.reviewCredits,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
