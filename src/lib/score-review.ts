import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  sendScoreReviewLandedEmail,
  sendScoreRoomCompleteEmail,
  sendScoreTrackAvailableEmail,
} from "@/lib/email/score";

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

/** Where in their 30-day cycle a subscriber currently sits. */
function roomCycle(anchor: Date): { periodStart: Date; resetsAt: Date } {
  const periodsPassed = Math.max(0, Math.floor((Date.now() - anchor.getTime()) / ROOM_CYCLE_MS));
  const periodStart = new Date(anchor.getTime() + periodsPassed * ROOM_CYCLE_MS);
  return { periodStart, resetsAt: new Date(periodStart.getTime() + ROOM_CYCLE_MS) };
}

/**
 * A subscriber's monthly real-reviewer-round allowance.
 *
 * "Rounds used" = reports granted the real room this 30-day cycle (anchored at
 * subscription start). A report is granted a room when it's unlocked and not
 * room-skipped — independent of whether reviewers have claimed it yet — so the
 * cap holds even before any listener picks the track up.
 */
export async function getScoreRoomQuota(email: string): Promise<ScoreRoomQuota> {
  const norm = email.trim().toLowerCase();
  const sub = await prisma.scoreSubscriber.findUnique({
    where: { email: norm },
    select: { createdAt: true },
  });

  const { periodStart, resetsAt } = roomCycle(sub?.createdAt ?? new Date());

  const used = await prisma.trackScoreReport.count({
    where: {
      email: { equals: norm, mode: "insensitive" },
      createdAt: { gte: periodStart },
      paidAt: { not: null },
      humanRoomSkipped: false,
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
 * Decide whether an unlocked report gets the real room, honoring the subscriber's
 * monthly cap. We no longer push the room onto specific reviewers — instead an
 * eligible report (unlocked + not skipped) simply enters the open claim pool that
 * reviewers pull from. This only flags the report when the subscriber is OVER
 * their cap (humanRoomSkipped = true → excluded from the pool; AI read only).
 *
 * A Postgres advisory lock keyed on the subscriber's email serializes concurrent
 * submits, so the cap can't be raced at the boundary.
 */
export async function decideRoomEligibility(
  email: string,
  reportId: string
): Promise<{ granted: boolean }> {
  const norm = email.trim().toLowerCase();
  return prisma.$transaction(async (tx) => {
    // Block other submits for this subscriber until we commit.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${norm}))`;

    const sub = await tx.scoreSubscriber.findUnique({
      where: { email: norm },
      select: { createdAt: true },
    });
    const { periodStart } = roomCycle(sub?.createdAt ?? new Date());

    // Granted rounds this cycle (this report already has paidAt set by the caller).
    const granted = await tx.trackScoreReport.count({
      where: {
        email: { equals: norm, mode: "insensitive" },
        createdAt: { gte: periodStart },
        paidAt: { not: null },
        humanRoomSkipped: false,
      },
    });

    if (granted > SCORE_ROOM_CAP) {
      await tx.trackScoreReport.update({
        where: { id: reportId },
        data: { humanRoomSkipped: true },
      });
      return { granted: false };
    }
    return { granted: true };
  });
}

const CLAIM_TTL_MS = 3 * 24 * 60 * 60 * 1000; // a claimed seat must be reviewed within 3 days

export type ClaimResult =
  | { ok: true; reviewId: string }
  | { ok: false; reason: "unavailable" | "own_track" | "full" };

/**
 * Claim a reviewer seat on a report (the pull side of the room).
 *
 * Idempotent: if the reviewer already holds a seat, returns it. Atomic via an
 * advisory lock on the report so the room can't be over-filled by races. A report
 * is claimable while it's unlocked, room-eligible (not skipped), not yet complete,
 * and still has open seats — and never by its own artist.
 */
export async function claimScoreReviewSeat(
  userId: string,
  reportId: string
): Promise<ClaimResult> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, ArtistProfile: { select: { id: true } } },
  });
  const myEmail = me?.email?.trim().toLowerCase() ?? null;
  const myArtistId = me?.ArtistProfile?.id ?? null;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`room:${reportId}`}))`;

    const report = await tx.trackScoreReport.findUnique({
      where: { id: reportId },
      select: { id: true, email: true, artistId: true, paidAt: true, status: true, humanRoomSkipped: true, humanReviewsRequested: true },
    });
    if (!report || report.paidAt == null || report.humanRoomSkipped || report.status === "COMPLETED") {
      return { ok: false as const, reason: "unavailable" as const };
    }

    // Already holding a seat? Hand it back (re-entry / refresh).
    const mine = await tx.scoreReview.findFirst({
      where: { reportId, reviewerId: userId },
      select: { id: true },
    });
    if (mine) return { ok: true as const, reviewId: mine.id };

    // Never review your own track.
    if (
      (myEmail && report.email.trim().toLowerCase() === myEmail) ||
      (myArtistId && report.artistId === myArtistId)
    ) {
      return { ok: false as const, reason: "own_track" as const };
    }

    // Seats: active claims (not expired) + completed. Stop at the target.
    const taken = await tx.scoreReview.count({
      where: {
        reportId,
        OR: [{ status: "COMPLETED" }, { status: { in: ["ASSIGNED", "IN_PROGRESS"] }, expiresAt: { gt: new Date() } }],
      },
    });
    if (taken >= report.humanReviewsRequested) {
      return { ok: false as const, reason: "full" as const };
    }

    const created = await tx.scoreReview.create({
      data: {
        reportId,
        reviewerId: userId,
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() + CLAIM_TTL_MS),
      },
      select: { id: true },
    });
    return { ok: true as const, reviewId: created.id };
  });
}

export type QueueItem = {
  id: string; // reportId — the review page claims a seat on open
  trackTitle: string | null;
  genre: string | null;
  claimed: boolean; // already picked up by this reviewer (in progress)
};

// How many open tracks to surface at once. Capped so the queue reads like a
// curated set of assignments rather than a bottomless pile.
const QUEUE_AVAILABLE_LIMIT = 8;

/**
 * A reviewer's queue. Under the hood this is a claim pool, but it's presented as
 * "their" tracks: anything they've already picked up (in progress) first, then
 * open reports waiting for the room — oldest first so the backlog clears.
 */
export async function getScoreReviewQueue(userId: string): Promise<QueueItem[]> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, ArtistProfile: { select: { id: true } } },
  });
  const myEmail = me?.email?.trim().toLowerCase() ?? null;
  const myArtistId = me?.ArtistProfile?.id ?? null;
  const now = new Date();

  // 1) Tracks this reviewer has already claimed and not yet submitted.
  const claimed = await prisma.scoreReview.findMany({
    where: { reviewerId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] }, expiresAt: { gt: now } },
    orderBy: { assignedAt: "asc" },
    select: { TrackScoreReport: { select: { id: true, trackTitle: true, genre: true } } },
  });
  const claimedItems: QueueItem[] = claimed
    .filter((r) => r.TrackScoreReport)
    .map((r) => ({ id: r.TrackScoreReport!.id, trackTitle: r.TrackScoreReport!.trackTitle, genre: r.TrackScoreReport!.genre, claimed: true }));
  const claimedReportIds = new Set(claimedItems.map((c) => c.id));

  // 2) Open reports waiting for the room: unlocked, room-eligible, not complete,
  //    not their own, and not already reviewed/claimed by them.
  const open = await prisma.trackScoreReport.findMany({
    where: {
      paidAt: { not: null },
      humanRoomSkipped: false,
      status: { not: "COMPLETED" },
      ScoreReview: { none: { reviewerId: userId } },
      ...(myArtistId ? { artistId: { not: myArtistId } } : {}),
      ...(myEmail ? { NOT: { email: { equals: myEmail, mode: "insensitive" } } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 60,
    select: {
      id: true,
      trackTitle: true,
      genre: true,
      humanReviewsRequested: true,
      _count: {
        select: {
          ScoreReview: {
            where: {
              OR: [
                { status: "COMPLETED" },
                { status: { in: ["ASSIGNED", "IN_PROGRESS"] }, expiresAt: { gt: now } },
              ],
            },
          },
        },
      },
    },
  });

  const availableItems: QueueItem[] = open
    .filter((r) => !claimedReportIds.has(r.id) && r._count.ScoreReview < r.humanReviewsRequested)
    .slice(0, QUEUE_AVAILABLE_LIMIT)
    .map((r) => ({ id: r.id, trackTitle: r.trackTitle, genre: r.genre, claimed: false }));

  return [...claimedItems, ...availableItems];
}

/**
 * Notify the reviewer pool that a track just entered the claim pool, so it gets
 * picked up instead of sitting idle. The room is pull-based (reviewers claim from
 * `/score-review`), so without this nudge tracks sit unclaimed — best-effort,
 * fire-and-forget from the caller. Fires once per track (the webhook unlock /
 * subscribe path runs once per payment). Toggle off with NOTIFY_SCORE_REVIEWERS=false.
 *
 * Recipients = real `isScoreReviewer` users, minus seed placeholders and the
 * track's own owner. Returns how many emails sent.
 */
export async function notifyScoreReviewersOfNewTrack(reportId: string): Promise<number> {
  if (process.env.NOTIFY_SCORE_REVIEWERS === "false") return 0;

  const report = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: {
      genre: true,
      email: true,
      paidAt: true,
      humanRoomSkipped: true,
      status: true,
    },
  });
  // Only a live, room-eligible track is worth a nudge.
  if (!report || !report.paidAt || report.humanRoomSkipped || report.status === "COMPLETED") {
    return 0;
  }

  const ownerEmail = report.email?.trim().toLowerCase() ?? "";
  const reviewers = await prisma.user.findMany({
    where: {
      isScoreReviewer: true,
      // never email seed placeholders or the track's own owner
      email: { not: { contains: "@seed.mixreflect.com" } },
      ...(ownerEmail ? { NOT: { email: { equals: ownerEmail, mode: "insensitive" } } } : {}),
    },
    select: { email: true },
  });
  const emails = reviewers.map((r) => r.email).filter((e): e is string => Boolean(e));
  if (emails.length === 0) return 0;

  const concurrency = Number(process.env.NOTIFY_CONCURRENCY ?? "10");
  let sent = 0;
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((to) =>
        sendScoreTrackAvailableEmail({ to, genre: report.genre, rateCents: SCORE_REVIEW_RATE_CENTS })
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) sent++;
      else if (r.status === "rejected") console.error("notifyScoreReviewersOfNewTrack: send failed", r.reason);
    }
  }
  return sent;
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
