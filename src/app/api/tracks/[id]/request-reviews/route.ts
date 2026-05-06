import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { hasAvailableSlot, ACTIVE_TRACK_STATUSES } from "@/lib/slots";

const requestSchema = z.object({
  desiredReviews: z.number().int().min(1).max(10),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = requestSchema.parse(body);

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        ArtistProfile: {
          select: {
            userId: true,
            subscriptionStatus: true,
            reviewCredits: true,
          }
        },
        Review: { select: { id: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (track.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cancelled tracks cannot be updated" },
        { status: 400 }
      );
    }

    // Allow requesting more reviews on tracks that are UPLOADED, COMPLETED, or IN_PROGRESS
    const eligibleStatuses = ["UPLOADED", "PENDING_PAYMENT", "COMPLETED", "IN_PROGRESS", "QUEUED"];
    if (!eligibleStatuses.includes(track.status)) {
      return NextResponse.json(
        { error: "Track is not eligible for requesting reviews" },
        { status: 400 }
      );
    }

    // Slot enforcement: if this track isn't already active, it will occupy a new slot
    const isAlreadyActive = (ACTIVE_TRACK_STATUSES as readonly string[]).includes(track.status);
    if (!isAlreadyActive) {
      const isPro = track.ArtistProfile.subscriptionStatus === "active";
      const slotCheck = await hasAvailableSlot(track.artistId, isPro);
      if (!slotCheck.available) {
        return NextResponse.json(
          {
            error: "All your review slots are in use. Wait for current reviews to complete, or upgrade to Pro for more slots.",
            activeCount: slotCheck.activeCount,
            maxSlots: slotCheck.maxSlots,
          },
          { status: 409 }
        );
      }
    }

    const desired = data.desiredReviews;
    const cost = desired;

    if ((track.ArtistProfile.reviewCredits ?? 0) < cost) {
      return NextResponse.json(
        { error: "Not enough credits. Earn more by reviewing tracks or buy a top-up." },
        { status: 403 }
      );
    }

    // Determine new status before transaction to minimise work inside it
    const hasExistingReviews = track.Review.length > 0;
    const currentReviewsRequested = track.reviewsRequested ?? 0;
    const newReviewsRequested = currentReviewsRequested + desired;
    const newStatus = hasExistingReviews ? "IN_PROGRESS" : "QUEUED";

    await prisma.$transaction([
      prisma.artistProfile.updateMany({
        where: {
          id: track.artistId,
          reviewCredits: { gte: cost },
        },
        data: {
          reviewCredits: { decrement: cost },
          totalCreditsSpent: { increment: cost },
        },
      }),
      prisma.track.update({
        where: { id: track.id },
        data: {
          packageType: hasExistingReviews ? track.packageType : "PEER",
          reviewsRequested: newReviewsRequested,
          creditsSpent: { increment: cost },
          status: newStatus,
          paidAt: track.paidAt ?? new Date(),
          completedAt: null,
        },
      }),
    ]);

    await assignReviewersToTrack(track.id);
    revalidateTag("sidebar", { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "TRACK_NOT_ELIGIBLE") {
      return NextResponse.json(
        { error: "Track is not eligible for requesting reviews" },
        { status: 400 }
      );
    }

    console.error("Request reviews error:", error);
    return NextResponse.json(
      { error: "Failed to request reviews" },
      { status: 500 }
    );
  }
}
