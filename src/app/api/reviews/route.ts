import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TIER_RATES, updateReviewerTier } from "@/lib/queue";
import { sendReviewProgressEmail } from "@/lib/email";

const MIN_LISTEN_SECONDS = 180;
const MIN_WORDS_PER_SECTION = 30;

function extractWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function validateReviewText(fieldLabel: string, text: string): string | null {
  const words = extractWords(text);

  if (words.length < MIN_WORDS_PER_SECTION) {
    return `${fieldLabel} must be at least ${MIN_WORDS_PER_SECTION} words`;
  }

  const unique = new Set(words);
  const uniqueRatio = unique.size / words.length;

  if (unique.size < 8 || uniqueRatio < 0.3) {
    return `${fieldLabel} seems too repetitive. Please be more specific.`;
  }

  return null;
}

const submitReviewSchema = z.object({
  reviewId: z.string(),
  firstImpression: z.enum(["STRONG_HOOK", "DECENT", "LOST_INTEREST"]),
  productionScore: z.number().min(1).max(5),
  vocalScore: z.number().min(1).max(5).optional().nullable(),
  originalityScore: z.number().min(1).max(5),
  wouldListenAgain: z.boolean(),
  perceivedGenre: z.string().optional(),
  similarArtists: z.string().optional(),
  bestPart: z.string().min(1, "Please describe the best part"),
  bestPartTimestamp: z.number().optional().nullable(),
  weakestPart: z.string().min(1, "Please describe the weakest part"),
  weakestTimestamp: z.number().optional().nullable(),
  additionalNotes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = submitReviewSchema.parse(body);

    // Get the review and verify ownership
    const review = await prisma.review.findUnique({
      where: { id: data.reviewId },
      include: {
        reviewer: true,
        track: {
          include: {
            artist: { include: { user: true } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.reviewer.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Review already submitted" },
        { status: 400 }
      );
    }

    if (review.listenDuration < MIN_LISTEN_SECONDS) {
      return NextResponse.json(
        { error: `Must listen for at least ${MIN_LISTEN_SECONDS} seconds` },
        { status: 400 }
      );
    }

    if (
      !review.lastHeartbeat ||
      Date.now() - review.lastHeartbeat.getTime() > 2 * 60 * 1000
    ) {
      return NextResponse.json(
        { error: "Listen session expired. Please keep listening and try again." },
        { status: 400 }
      );
    }

    const bestPartError = validateReviewText("Best part", data.bestPart);
    if (bestPartError) {
      return NextResponse.json({ error: bestPartError }, { status: 400 });
    }

    const weakestPartError = validateReviewText("Weakest part", data.weakestPart);
    if (weakestPartError) {
      return NextResponse.json({ error: weakestPartError }, { status: 400 });
    }

    // Calculate earnings based on tier
    const earnings = TIER_RATES[review.reviewer.tier];

    // Update review with all data
    const updatedReview = await prisma.review.update({
      where: { id: data.reviewId },
      data: {
        status: "COMPLETED",
        firstImpression: data.firstImpression,
        productionScore: data.productionScore,
        vocalScore: data.vocalScore,
        originalityScore: data.originalityScore,
        wouldListenAgain: data.wouldListenAgain,
        perceivedGenre: data.perceivedGenre,
        similarArtists: data.similarArtists,
        bestPart: data.bestPart,
        bestPartTimestamp: data.bestPartTimestamp,
        weakestPart: data.weakestPart,
        weakestTimestamp: data.weakestTimestamp,
        additionalNotes: data.additionalNotes,
        paidAmount: earnings,
      },
    });

    // Update reviewer stats
    await prisma.reviewerProfile.update({
      where: { id: review.reviewerId },
      data: {
        totalReviews: { increment: 1 },
        pendingBalance: { increment: earnings },
        totalEarnings: { increment: earnings },
      },
    });

    // Update tier if needed
    await updateReviewerTier(review.reviewerId);

    // Update track review count
    const completedReviews = await prisma.review.count({
      where: {
        trackId: review.trackId,
        status: "COMPLETED",
      },
    });

    await prisma.track.update({
      where: { id: review.trackId },
      data: {
        reviewsCompleted: completedReviews,
        ...(completedReviews >= review.track.reviewsRequested && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
      },
    });

    const milestoneHalf = Math.ceil(review.track.reviewsRequested / 2);
    const milestoneFull = review.track.reviewsRequested;

    if (
      review.track.artist.user.email &&
      (completedReviews === milestoneHalf || completedReviews === milestoneFull)
    ) {
      await sendReviewProgressEmail(
        review.track.artist.user.email,
        review.track.title,
        completedReviews,
        review.track.reviewsRequested
      );
    }

    // Remove from queue
    await prisma.reviewQueue.deleteMany({
      where: {
        trackId: review.trackId,
        reviewerId: review.reviewerId,
      },
    });

    return NextResponse.json({
      success: true,
      earnings,
      review: updatedReview,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
