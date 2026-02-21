import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await request.json().catch(() => ({}));

    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        ArtistProfile: true,
        Review: {
          select: { id: true, status: true },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow dequeue for active tracks
    const dequeueableStatuses = ["QUEUED", "IN_PROGRESS", "PENDING_PAYMENT"];
    if (!dequeueableStatuses.includes(track.status)) {
      return NextResponse.json(
        { error: "Track is not currently in the queue" },
        { status: 400 }
      );
    }

    // Calculate credit refund: reviews requested minus completed
    const completedReviews = track.Review.filter(
      (r) => r.status === "COMPLETED"
    ).length;
    const creditsToRefund = Math.max(
      0,
      (track.reviewsRequested ?? 0) - completedReviews
    );

    // Determine new status: COMPLETED if it has completed reviews, UPLOADED otherwise
    const newStatus = completedReviews > 0 ? "COMPLETED" : "UPLOADED";

    await prisma.$transaction([
      // Update track status and adjust reviewsRequested to match completed
      prisma.track.update({
        where: { id: track.id },
        data: {
          status: newStatus,
          reviewsRequested: completedReviews,
          creditsSpent: { decrement: creditsToRefund },
          completedAt: completedReviews > 0 ? new Date() : null,
        },
      }),
      // Refund credits to artist
      ...(creditsToRefund > 0
        ? [
            prisma.artistProfile.update({
              where: { id: track.artistId },
              data: {
                reviewCredits: { increment: creditsToRefund },
                totalCreditsSpent: { decrement: creditsToRefund },
              },
            }),
          ]
        : []),
      // Cancel pending review queue entries
      prisma.reviewQueue.deleteMany({
        where: { trackId: track.id },
      }),
      // Expire unfinished review assignments
      prisma.review.updateMany({
        where: {
          trackId: track.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        data: { status: "EXPIRED" },
      }),
    ]);

    revalidateTag("sidebar", { expire: 0 });

    return NextResponse.json({
      success: true,
      creditsRefunded: creditsToRefund,
      newStatus,
    });
  } catch (error) {
    console.error("Dequeue track error:", error);
    return NextResponse.json(
      { error: "Failed to remove track from queue" },
      { status: 500 }
    );
  }
}
