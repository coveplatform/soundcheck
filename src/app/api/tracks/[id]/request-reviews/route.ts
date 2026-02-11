import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PACKAGES, PackageType } from "@/lib/metadata";
import { assignReviewersToTrack } from "@/lib/queue";

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

    const desired = data.desiredReviews;
    const cost = desired;

    if ((track.ArtistProfile.reviewCredits ?? 0) < cost) {
      return NextResponse.json(
        { error: "Not enough credits. Earn more by reviewing tracks or buy a top-up." },
        { status: 403 }
      );
    }

    const packageType: PackageType = "PEER";

    await prisma.$transaction(async (tx) => {
      const updatedCredits = await tx.artistProfile.updateMany({
        where: {
          id: track.artistId,
          reviewCredits: {
            gte: cost,
          },
        },
        data: {
          reviewCredits: {
            decrement: cost,
          },
          totalCreditsSpent: {
            increment: cost,
          },
        },
      });

      if (updatedCredits.count === 0) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      // Determine new status based on current state
      const currentReviewsCompleted = track.reviewsCompleted ?? 0;
      const hasExistingReviews = track.Review.length > 0;
      const currentReviewsRequested = track.reviewsRequested ?? 0;
      const newReviewsRequested = currentReviewsRequested + desired;

      // If adding more reviews and already have some completed, go to IN_PROGRESS
      // If no reviews yet, go to QUEUED
      const newStatus = hasExistingReviews ? "IN_PROGRESS" : "QUEUED";

      await tx.track.update({
        where: { id: track.id },
        data: {
          packageType: hasExistingReviews ? track.packageType : packageType,
          reviewsRequested: newReviewsRequested,
          creditsSpent: { increment: cost },
          status: newStatus,
          paidAt: track.paidAt ?? new Date(),
          completedAt: null, // Clear completion if it was completed
        },
      });
    });

    await assignReviewersToTrack(track.id);

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
