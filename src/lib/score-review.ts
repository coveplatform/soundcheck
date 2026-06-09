import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendScoreReviewLandedEmail, sendScoreRoomCompleteEmail } from "@/lib/email/score";

// Either the base client or a transaction client — lets the assignment logic run
// inside claimAndAssignRoom's transaction (so the cap check + assign are atomic).
type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

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

// Subscribers get the real human "room" on up to this many tracks per 30-day
// cycle. Unlimited AI reads still apply — only the (paid) human room is metered,
// so reviewer payouts stay bounded. Each "round" = one full room of 5 listeners.
export const SCORE_ROOM_CAP = 3;
const ROOM_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

export type ScoreRoomQuota = {
  cap: number;
  used: number;
  remaining: number;
  periodStart: Date;
  resetsAt: Date;
};

/**
 * A subscriber's monthly real-reviewer-round allowance.
 *
 * "Rounds used" = their reports that had a human room assigned in the current
 * 30-day window (anchored at their subscription start). AI-only re-reads never
 * assign a room, so they don't burn a round.
 */
export async function getScoreRoomQuota(email: string): Promise<ScoreRoomQuota> {
  const norm = email.trim().toLowerCase();
  const sub = await prisma.scoreSubscriber.findUnique({
    where: { email: norm },
    select: { createdAt: true },
  });

  const anchor = sub?.createdAt ?? new Date();
  const now = Date.now();
  const periodsPassed = Math.max(0, Math.floor((now - anchor.getTime()) / ROOM_CYCLE_MS));
  const periodStart = new Date(anchor.getTime() + periodsPassed * ROOM_CYCLE_MS);
  const resetsAt = new Date(periodStart.getTime() + ROOM_CYCLE_MS);

  const used = await prisma.trackScoreReport.count({
    where: {
      email: { equals: norm, mode: "insensitive" },
      createdAt: { gte: periodStart },
      ScoreReview: { some: {} },
    },
  });

  return {
    cap: SCORE_ROOM_CAP,
    used,
    remaining: Math.max(0, SCORE_ROOM_CAP - used),
    periodStart,
    resetsAt,
  };
}

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
  count = 5,
  db: PrismaClientOrTx = prisma
): Promise<number> {
  const existing = await db.scoreReview.findMany({
    where: { reportId },
    select: { reviewerId: true },
  });
  const need = count - existing.length;
  if (need <= 0) return 0;

  const alreadyAssigned = existing
    .map((e) => e.reviewerId)
    .filter((id): id is string => !!id);

  // Never assign a track to its own owner (by email or linked artist profile).
  const report = await db.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { email: true, artistId: true },
  });
  const ownerIds: string[] = [];
  if (report?.email) {
    const owner = await db.user.findFirst({
      where: { email: { equals: report.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (owner) ownerIds.push(owner.id);
  }
  if (report?.artistId) {
    const ap = await db.artistProfile.findUnique({
      where: { id: report.artistId },
      select: { userId: true },
    });
    if (ap?.userId) ownerIds.push(ap.userId);
  }

  const exclude = [...alreadyAssigned, ...ownerIds];

  // Pick reviewers from the pool who aren't already on this report. Bias toward
  // the least-recently-active so load spreads across the pool.
  const reviewers = await db.user.findMany({
    where: {
      isScoreReviewer: true,
      id: { notIn: exclude.length ? exclude : ["__none__"] },
    },
    select: { id: true },
    orderBy: { lastActiveAt: "asc" },
    take: need,
  });
  if (reviewers.length === 0) return 0;

  const expiresAt = new Date(Date.now() + ASSIGN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const res = await db.scoreReview.createMany({
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

/**
 * Atomically claim a real-reviewer round for a subscriber and assign the room.
 *
 * A Postgres advisory lock keyed on the subscriber's email serializes concurrent
 * submits, so the monthly cap can't be raced (two simultaneous submits at the
 * boundary can no longer both slip through and over-assign a paid room).
 */
export async function claimAndAssignRoom(
  email: string,
  reportId: string
): Promise<{ assigned: boolean }> {
  const norm = email.trim().toLowerCase();
  return prisma.$transaction(async (tx) => {
    // Block other submits for this subscriber until we commit.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${norm}))`;

    const sub = await tx.scoreSubscriber.findUnique({
      where: { email: norm },
      select: { createdAt: true },
    });
    const anchor = sub?.createdAt ?? new Date();
    const periodsPassed = Math.max(0, Math.floor((Date.now() - anchor.getTime()) / ROOM_CYCLE_MS));
    const periodStart = new Date(anchor.getTime() + periodsPassed * ROOM_CYCLE_MS);

    const used = await tx.trackScoreReport.count({
      where: {
        email: { equals: norm, mode: "insensitive" },
        createdAt: { gte: periodStart },
        ScoreReview: { some: {} },
      },
    });

    if (used >= SCORE_ROOM_CAP) {
      await tx.trackScoreReport.update({
        where: { id: reportId },
        data: { humanRoomSkipped: true },
      });
      return { assigned: false };
    }

    await assignScoreReviewers(reportId, 5, tx);
    return { assigned: true };
  });
}

/** A reviewer's open queue: assigned/in-progress, not expired, newest first. */
export async function getScoreReviewQueue(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const myEmail = me?.email?.trim().toLowerCase() ?? null;

  const rows = await prisma.scoreReview.findMany({
    where: {
      reviewerId: userId,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      expiresAt: { gt: new Date() },
    },
    orderBy: { assignedAt: "asc" },
    include: {
      TrackScoreReport: {
        select: { slug: true, trackTitle: true, trackUrl: true, genre: true, email: true },
      },
    },
  });

  // Never show someone their own submission to review (covers any legacy self-assignments).
  return myEmail
    ? rows.filter((r) => (r.TrackScoreReport?.email ?? "").trim().toLowerCase() !== myEmail)
    : rows;
}

/** A reviewer's own completed reactions, newest first — for their history view. */
export async function getScoreReviewerHistory(userId: string, take = 50) {
  return prisma.scoreReview.findMany({
    where: { reviewerId: userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      headline: true,
      quote: true,
      positive: true,
      completedAt: true,
      TrackScoreReport: {
        select: { trackTitle: true, genre: true },
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

  // Guard: you can't review your own track.
  const [reportOwner, reviewerUser] = await Promise.all([
    prisma.trackScoreReport.findUnique({ where: { id: review.reportId }, select: { email: true } }),
    prisma.user.findUnique({ where: { id: input.reviewerId }, select: { email: true } }),
  ]);
  if (
    reportOwner?.email &&
    reviewerUser?.email &&
    reportOwner.email.trim().toLowerCase() === reviewerUser.email.trim().toLowerCase()
  ) {
    throw new Error("You can't review your own track");
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
    select: { humanReviewsRequested: true, status: true, email: true, trackTitle: true, slug: true },
  });
  if (report) {
    const done = await prisma.scoreReview.count({
      where: { reportId: review.reportId, status: "COMPLETED" },
    });
    const complete = done >= report.humanReviewsRequested;
    if (complete && report.status !== "COMPLETED") {
      await prisma.trackScoreReport.update({
        where: { id: review.reportId },
        data: { status: "COMPLETED" },
      });
    }
    // Keep the artist in the loop — fire-and-forget so it never blocks the review.
    if (report.email) {
      const common = { to: report.email, trackTitle: report.trackTitle ?? "", slug: report.slug };
      if (complete) {
        void sendScoreRoomCompleteEmail({ ...common, total: report.humanReviewsRequested }).catch(() => {});
      } else {
        void sendScoreReviewLandedEmail({ ...common, completed: done, total: report.humanReviewsRequested }).catch(() => {});
      }
    }
  }
  // +$0.40 — return the reviewer's updated balance for instant UI feedback.
  const earnings = await getScoreReviewerEarnings(input.reviewerId);
  return { ok: true, earnings, earnedCents: SCORE_REVIEW_RATE_CENTS };
}
