import { prisma } from "./prisma";
import { PackageType, ReviewerTier } from "@prisma/client";

const MIN_REVIEWER_ACCOUNT_AGE_HOURS = Number(
  process.env.MIN_REVIEWER_ACCOUNT_AGE_HOURS ?? "24"
);

// Tier-based pay rates in cents
export const TIER_RATES: Record<ReviewerTier, number> = {
  ROOKIE: 15,
  VERIFIED: 30,
  PRO: 50,
};

// Get eligible reviewers for a track
export async function getEligibleReviewers(
  trackId: string,
  packageType: PackageType
) {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { genres: true },
  });

  if (!track) return [];

  const genreIds = track.genres.map((g) => g.id);

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - (Number.isFinite(MIN_REVIEWER_ACCOUNT_AGE_HOURS) ? MIN_REVIEWER_ACCOUNT_AGE_HOURS : 24));

  // Base query for eligible reviewers
  const eligibleReviewers = await prisma.reviewerProfile.findMany({
    where: {
      completedOnboarding: true,
      onboardingQuizPassed: true,
      isRestricted: false,
      user: {
        createdAt: {
          lte: cutoff,
        },
      },
      // Must have at least one matching genre
      genres: {
        some: {
          id: { in: genreIds },
        },
      },
      // Haven't already reviewed this track
      reviews: {
        none: {
          trackId: track.id,
        },
      },
      // Not already in queue for this track
      queueEntries: {
        none: {
          trackId: track.id,
        },
      },
    },
    include: {
      genres: true,
      user: { select: { id: true, email: true } },
    },
    orderBy: [
      // Prioritize by tier
      { tier: "desc" },
      // Then by rating
      { averageRating: "desc" },
    ],
  });

  // Filter based on package type
  if (packageType === "PRO") {
    return eligibleReviewers.filter((r) => r.tier === "PRO");
  }

  if (packageType === "STANDARD") {
    // Priority to Verified and Pro, but allow Rookies if needed
    return eligibleReviewers.sort((a, b) => {
      const tierOrder = { PRO: 3, VERIFIED: 2, ROOKIE: 1 };
      return tierOrder[b.tier] - tierOrder[a.tier];
    });
  }

  return eligibleReviewers;
}

// Assign reviewers to a track
export async function assignReviewersToTrack(trackId: string) {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      reviews: true,
      queueEntries: true,
    },
  });

  if (!track || (track.status !== "QUEUED" && track.status !== "IN_PROGRESS")) {
    return;
  }

  const completedReviews = track.reviews.filter(
    (r) => r.status === "COMPLETED"
  ).length;
  const activeAssignments = track.reviews.filter(
    (r) => r.status === "ASSIGNED" || r.status === "IN_PROGRESS"
  ).length;

  const neededReviews = track.reviewsRequested - completedReviews - activeAssignments;

  if (neededReviews <= 0) return;

  const eligibleReviewers = await getEligibleReviewers(
    trackId,
    track.packageType
  );

  const reviewersToAssign = eligibleReviewers.slice(0, neededReviews);

  // Create queue entries
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiration

  for (const reviewer of reviewersToAssign) {
    await prisma.reviewQueue.create({
      data: {
        trackId,
        reviewerId: reviewer.id,
        expiresAt,
        priority:
          track.packageType === "PRO"
            ? 10
            : track.packageType === "STANDARD"
            ? 5
            : 0,
      },
    });

    // Create a pending review
    await prisma.review.create({
      data: {
        trackId,
        reviewerId: reviewer.id,
        status: "ASSIGNED",
      },
    });
  }

  // Update track status if we have all reviewers assigned
  if (reviewersToAssign.length >= neededReviews) {
    await prisma.track.update({
      where: { id: trackId },
      data: { status: "IN_PROGRESS" },
    });
  }
}

export async function expireAndReassignExpiredQueueEntries() {
  const now = new Date();

  const expired = await prisma.reviewQueue.findMany({
    where: {
      expiresAt: { lte: now },
    },
    select: {
      trackId: true,
      reviewerId: true,
    },
  });

  if (expired.length === 0) return;

  const affectedTrackIds = new Set<string>();

  for (const entry of expired) {
    affectedTrackIds.add(entry.trackId);

    await prisma.review.updateMany({
      where: {
        trackId: entry.trackId,
        reviewerId: entry.reviewerId,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
      data: { status: "EXPIRED" },
    });

    await prisma.reviewQueue.delete({
      where: {
        trackId_reviewerId: {
          trackId: entry.trackId,
          reviewerId: entry.reviewerId,
        },
      },
    });
  }

  for (const trackId of affectedTrackIds) {
    await assignReviewersToTrack(trackId);
  }
}

// Get queue for a reviewer
export async function getReviewerQueue(reviewerId: string) {
  const queueEntries = await prisma.reviewQueue.findMany({
    where: {
      reviewerId,
      expiresAt: { gt: new Date() },
    },
    include: {
      track: {
        include: {
          genres: true,
          artist: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { assignedAt: "asc" }],
  });

  return queueEntries;
}

// Calculate tier based on reviews and rating
export function calculateTier(
  totalReviews: number,
  averageRating: number
): ReviewerTier {
  if (totalReviews >= 100 && averageRating >= 4.5) {
    return "PRO";
  }
  if (totalReviews >= 25 && averageRating >= 4.0) {
    return "VERIFIED";
  }
  return "ROOKIE";
}

// Update reviewer tier
export async function updateReviewerTier(reviewerId: string) {
  const reviewer = await prisma.reviewerProfile.findUnique({
    where: { id: reviewerId },
  });

  if (!reviewer) return;

  const newTier = calculateTier(reviewer.totalReviews, reviewer.averageRating);

  if (newTier !== reviewer.tier) {
    await prisma.reviewerProfile.update({
      where: { id: reviewerId },
      data: { tier: newTier },
    });
  }
}

export async function updateReviewerAverageRating(reviewerId: string) {
  const agg = await prisma.review.aggregate({
    where: {
      reviewerId,
      artistRating: { not: null },
    },
    _avg: { artistRating: true },
  });

  await prisma.reviewerProfile.update({
    where: { id: reviewerId },
    data: {
      averageRating: agg._avg.artistRating ?? 0,
    },
  });
}
