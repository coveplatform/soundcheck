import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateReviewerTier, getTierRateCents, updateReviewerAverageRating } from "@/lib/queue";
import { sendReviewProgressEmail } from "@/lib/email";

const MIN_LISTEN_SECONDS = 180;
const MIN_WORDS_PER_SECTION = 30;

function extractWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function hasSpecificSignals(text: string, words: string[]): boolean {
  if (/\b\d:\d{2}\b/.test(text)) return true;
  if (/(because|so that|for example|e\.g\.)/i.test(text)) return true;

  const keywordSet = new Set([
    "kick",
    "snare",
    "hihat",
    "hat",
    "clap",
    "bass",
    "sub",
    "808",
    "vocal",
    "vocals",
    "hook",
    "chorus",
    "verse",
    "drop",
    "bridge",
    "mix",
    "mixing",
    "master",
    "mastering",
    "eq",
    "compress",
    "compression",
    "limiter",
    "reverb",
    "delay",
    "stereo",
    "mono",
    "pan",
    "panning",
    "automation",
    "arrangement",
    "structure",
    "tempo",
    "bpm",
  ]);

  for (const w of words) {
    if (keywordSet.has(w)) return true;
  }

  return false;
}

function countActionLines(text: string): number {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length;
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

  if (!hasSpecificSignals(text, words)) {
    return `${fieldLabel} needs more specific, actionable details (e.g. mention an element like vocals/kick, a section like the drop, or a timestamp).`;
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
  addressedArtistNote: z.enum(["YES", "PARTIALLY", "NO"]),
  nextActions: z.string().min(1, "Please provide next actions"),
  timestamps: z
    .array(
      z.object({
        seconds: z.number().int().min(0),
        note: z.string().min(1).max(240),
      })
    )
    .max(30)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to submit reviews" },
        { status: 403 }
      );
    }

    const reviewerProfile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
    });

    if (!reviewerProfile) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    if (reviewerProfile.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
      return NextResponse.json(
        { error: "Please complete onboarding before submitting reviews" },
        { status: 403 }
      );
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

    if (review.status !== "ASSIGNED" && review.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "This review is no longer active" },
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

    const nextActionsWords = extractWords(data.nextActions);
    const nextActionsUnique = new Set(nextActionsWords);
    const nextActionsUniqueRatio =
      nextActionsWords.length > 0 ? nextActionsUnique.size / nextActionsWords.length : 0;

    if (countActionLines(data.nextActions) < 3) {
      return NextResponse.json(
        { error: "Next actions must include at least 3 lines (one actionable step per line)." },
        { status: 400 }
      );
    }

    if (nextActionsUnique.size < 6 || nextActionsUniqueRatio < 0.35) {
      return NextResponse.json(
        { error: "Next actions seems too repetitive. Please be more specific." },
        { status: 400 }
      );
    }

    if (!hasSpecificSignals(data.nextActions, nextActionsWords)) {
      return NextResponse.json(
        {
          error:
            "Next actions needs more specific, actionable details (e.g. mention an element like vocals/kick, a section like the drop, or a timestamp).",
        },
        { status: 400 }
      );
    }

    // Calculate earnings based on tier
    const earnings = getTierRateCents(review.reviewer.tier);

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
        addressedArtistNote: data.addressedArtistNote,
        nextActions: data.nextActions,
        timestamps: data.timestamps,
        paidAmount: earnings,
      },
    });

    // Update reviewer stats
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    await prisma.reviewerProfile.update({
      where: { id: review.reviewerId },
      data: {
        totalReviews: { increment: 1 },
        pendingBalance: { increment: earnings },
        totalEarnings: { increment: earnings },
        lastReviewDate: now,
        reviewsToday:
          review.reviewer.lastReviewDate &&
          review.reviewer.lastReviewDate >= startOfToday
            ? { increment: 1 }
            : 1,
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
