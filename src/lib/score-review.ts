import { prisma } from "@/lib/prisma";

/**
 * The "room of 5" — real human listeners on a score report.
 *
 * The AI pass gives the instant read; this assigns the submission to a small
 * internal pool of human reviewers (Users flagged `isScoreReviewer`) who listen
 * and leave a reaction. Their reactions stream into the report alongside the AI
 * read and are gated the same way (headline + rating free, full quote on unlock).
 */

const ASSIGN_EXPIRY_DAYS = 3;

// Reviewer pay. Earnings are derived from completed reviews (no stored balance
// yet) and paid out manually once a reviewer clears the threshold.
export const SCORE_REVIEW_RATE_CENTS = 40; // $0.40 per completed review
export const SCORE_PAYOUT_THRESHOLD_CENTS = 1000; // $10.00 minimum cash-out

export type ScoreReviewerEarnings = {
  completed: number;
  cents: number;
  canPayout: boolean;
};

/** Live earnings for a score reviewer, derived from their completed reactions. */
export async function getScoreReviewerEarnings(
  userId: string
): Promise<ScoreReviewerEarnings> {
  const completed = await prisma.scoreReview.count({
    where: { reviewerId: userId, status: "COMPLETED" },
  });
  const cents = completed * SCORE_REVIEW_RATE_CENTS;
  return {
    completed,
    cents,
    canPayout: cents >= SCORE_PAYOUT_THRESHOLD_CENTS,
  };
}

/**
 * Assign a report to up to `count` human reviewers from the internal pool.
 * Idempotent-ish: only tops up to the target, never double-assigns the same
 * reviewer to the same report (DB unique [reportId, reviewerId]).
 */
export async function assignScoreReviewers(
  reportId: string,
  count = 5
): Promise<number> {
  const existing = await prisma.scoreReview.findMany({
    where: { reportId },
    select: { reviewerId: true },
  });
  const need = count - existing.length;
  if (need <= 0) return 0;

  const alreadyAssigned = existing
    .map((e) => e.reviewerId)
    .filter((id): id is string => !!id);

  // Pick reviewers from the pool who aren't already on this report. Bias toward
  // the least-recently-active so load spreads across the pool.
  const reviewers = await prisma.user.findMany({
    where: {
      isScoreReviewer: true,
      id: { notIn: alreadyAssigned.length ? alreadyAssigned : ["__none__"] },
    },
    select: { id: true },
    orderBy: { lastActiveAt: "asc" },
    take: need,
  });
  if (reviewers.length === 0) return 0;

  const expiresAt = new Date(Date.now() + ASSIGN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const res = await prisma.scoreReview.createMany({
    data: reviewers.map((r) => ({
      reportId,
      reviewerId: r.id,
      status: "ASSIGNED" as const,
      expiresAt,
    })),
    skipDuplicates: true,
  });
  return res.count;
}

/** A reviewer's open queue: assigned/in-progress, not expired, newest first. */
export async function getScoreReviewQueue(userId: string) {
  return prisma.scoreReview.findMany({
    where: {
      reviewerId: userId,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      expiresAt: { gt: new Date() },
    },
    orderBy: { assignedAt: "asc" },
    include: {
      TrackScoreReport: {
        select: { slug: true, trackTitle: true, trackUrl: true, genre: true },
      },
    },
  });
}

/** Completed human reactions for a report (for the report view). */
export async function getReportHumanReviews(reportId: string) {
  return prisma.scoreReview.findMany({
    where: { reportId, status: "COMPLETED" },
    orderBy: { completedAt: "asc" },
    select: {
      id: true,
      rating: true,
      headline: true,
      quote: true,
      positive: true,
      completedAt: true,
    },
  });
}

export type SubmitScoreReviewInput = {
  reviewId: string;
  reviewerId: string;
  rating: number;
  headline: string;
  quote: string;
  positive: boolean;
};

/**
 * A reviewer submits their reaction. Verifies they own the assignment, marks it
 * COMPLETED, and flips the report to COMPLETED once the full room has weighed in.
 */
export async function submitScoreReview(input: SubmitScoreReviewInput) {
  const review = await prisma.scoreReview.findUnique({
    where: { id: input.reviewId },
    select: { id: true, reviewerId: true, reportId: true, status: true },
  });
  if (!review) throw new Error("Assignment not found");
  if (review.reviewerId !== input.reviewerId) throw new Error("Not your assignment");
  if (review.status === "COMPLETED") {
    return { ok: true, alreadyDone: true, earnings: await getScoreReviewerEarnings(input.reviewerId) };
  }

  await prisma.scoreReview.update({
    where: { id: review.id },
    data: {
      status: "COMPLETED",
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      headline: input.headline.trim().slice(0, 140),
      quote: input.quote.trim().slice(0, 1200),
      positive: input.positive,
      completedAt: new Date(),
    },
  });

  // If the whole room is in, mark the report complete.
  const report = await prisma.trackScoreReport.findUnique({
    where: { id: review.reportId },
    select: { humanReviewsRequested: true, status: true },
  });
  if (report) {
    const done = await prisma.scoreReview.count({
      where: { reportId: review.reportId, status: "COMPLETED" },
    });
    if (done >= report.humanReviewsRequested && report.status !== "COMPLETED") {
      await prisma.trackScoreReport.update({
        where: { id: review.reportId },
        data: { status: "COMPLETED" },
      });
    }
  }
  // +$0.40 — return the reviewer's updated balance for instant UI feedback.
  const earnings = await getScoreReviewerEarnings(input.reviewerId);
  return { ok: true, earnings, earnedCents: SCORE_REVIEW_RATE_CENTS };
}
