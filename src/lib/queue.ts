import { prisma } from "./prisma";
import { PackageType, ReviewerTier } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { sendTierChangeEmail } from "@/lib/email";
import { PACKAGES } from "@/lib/metadata";

const MIN_REVIEWER_ACCOUNT_AGE_HOURS = Number(
  process.env.MIN_REVIEWER_ACCOUNT_AGE_HOURS ?? "24"
);

// Parent genre slugs mapped to their child slugs for hierarchical matching
const GENRE_HIERARCHY: Record<string, string[]> = {
  electronic: [
    "house", "deep-house", "progressive-house", "techno", "hard-techno",
    "drum-and-bass", "dubstep", "trance", "ambient", "edm", "synthwave",
    "lo-fi", "future-bass",
  ],
  "hip-hop-rnb": ["hip-hop", "trap", "rnb", "boom-bap", "drill"],
  "rock-metal": ["rock", "indie-rock", "alternative", "metal", "punk"],
  "pop-parent": ["pop", "indie-pop", "electropop", "synth-pop"],
  other: [
    "jazz", "soul", "funk", "reggae", "country", "folk", "classical",
    "world", "experimental", "singer-songwriter",
  ],
};

// Reverse mapping: child slug -> parent slug
const CHILD_TO_PARENT: Record<string, string> = {};
for (const [parent, children] of Object.entries(GENRE_HIERARCHY)) {
  for (const child of children) {
    CHILD_TO_PARENT[child] = parent;
  }
}

/**
 * Expand genre IDs to include parent genres for matching.
 * If a track has "deep-house", this returns IDs for both "deep-house" AND "electronic"
 * so reviewers with either will match.
 */
async function expandGenresForMatching(genreIds: string[]): Promise<string[]> {
  // Get the genres from the database to know their slugs
  const genres = await prisma.genre.findMany({
    where: { id: { in: genreIds } },
    select: { id: true, slug: true },
  });

  const expandedSlugs = new Set<string>();

  for (const genre of genres) {
    expandedSlugs.add(genre.slug);

    // If this is a child genre, also add the parent
    const parentSlug = CHILD_TO_PARENT[genre.slug];
    if (parentSlug) {
      expandedSlugs.add(parentSlug);
    }

    // If this is a parent genre, also add all children
    const childSlugs = GENRE_HIERARCHY[genre.slug];
    if (childSlugs) {
      for (const child of childSlugs) {
        expandedSlugs.add(child);
      }
    }
  }

  // Get IDs for all expanded slugs
  const expandedGenres = await prisma.genre.findMany({
    where: { slug: { in: Array.from(expandedSlugs) } },
    select: { id: true },
  });

  return expandedGenres.map((g) => g.id);
}

// Tier-based pay rates in cents
export const TIER_RATES = {
  NORMAL: 50,
  PRO: 150,
} as const;

function getNonProTierValue(): ReviewerTier {
  const enumObj = ReviewerTier as unknown as Record<string, ReviewerTier | undefined>;
  return enumObj.NORMAL ?? ("NORMAL" as unknown as ReviewerTier);
}

export function getTierRateCents(tier: ReviewerTier): number {
  return tier === "PRO" ? TIER_RATES.PRO : TIER_RATES.NORMAL;
}

// Get eligible reviewers for a track
export async function getEligibleReviewers(
  trackId: string,
  _packageType: PackageType
) {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { genres: true },
  });

  if (!track) return [];

  const trackGenreIds = track.genres.map((g) => g.id);

  // Expand genres to include parent/child relationships for matching
  // e.g., track with "deep-house" will match reviewers with "electronic" OR "deep-house"
  const genreIds = await expandGenresForMatching(trackGenreIds);

  const bypassPayments =
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_PAYMENTS === "true";

  const minAccountAgeHours = bypassPayments ? 0 : MIN_REVIEWER_ACCOUNT_AGE_HOURS;

  const cutoff = new Date();
  cutoff.setHours(
    cutoff.getHours() -
      (Number.isFinite(minAccountAgeHours) ? minAccountAgeHours : 24)
  );

  const where: Prisma.ReviewerProfileWhereInput = {
    completedOnboarding: true,
    onboardingQuizPassed: true,
    isRestricted: false,
    user: {
      createdAt: {
        lte: cutoff,
      },
      emailVerified: {
        not: null,
      },
    },
    genres: {
      some: {
        id: { in: genreIds },
      },
    },
    reviews: {
      none: {
        trackId: track.id,
      },
    },
    queueEntries: {
      none: {
        trackId: track.id,
      },
    },
  };

  // Base query for eligible reviewers
  const eligibleReviewers = await prisma.reviewerProfile.findMany({
    where,
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

  const sortedByQuality = eligibleReviewers.sort((a, b) => {
    const tierWeight = (tier: ReviewerTier) => (tier === "PRO" ? 2 : 1);
    const tierDiff = tierWeight(b.tier) - tierWeight(a.tier);
    if (tierDiff !== 0) return tierDiff;

    const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;

    const gemDiff = (b.gemCount ?? 0) - (a.gemCount ?? 0);
    return gemDiff;
  });
  return sortedByQuality;
}

export async function assignReviewersToRecentTracks(limit = 20) {
  const tracks = await prisma.track.findMany({
    where: {
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  for (const t of tracks) {
    await assignReviewersToTrack(t.id);
  }
}

// Assign reviewers to a track
export async function assignReviewersToTrack(trackId: string) {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      reviews: {
        include: {
          reviewer: {
            select: {
              tier: true,
            },
          },
        },
      },
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

  const countedStatuses = new Set(["ASSIGNED", "IN_PROGRESS", "COMPLETED"]);
  const existingProCount = track.reviews.filter(
    (r) => countedStatuses.has(r.status) && r.reviewer?.tier === "PRO"
  ).length;

  const neededReviews = track.reviewsRequested - completedReviews - activeAssignments;

  if (neededReviews <= 0) return;

  const eligibleReviewers = await getEligibleReviewers(
    trackId,
    track.packageType
  );

  const existingReviewerIds = new Set(track.reviews.map((r) => r.reviewerId));
  const eligibleUnique = eligibleReviewers.filter((r) => !existingReviewerIds.has(r.id));

  const packageConfig = (PACKAGES as unknown as Record<string, { minProReviews?: number }>)[
    track.packageType
  ];
  const proReviewCap = Math.max(0, packageConfig?.minProReviews ?? 0);

  const proShortfall = Math.max(
    0,
    Math.min(proReviewCap, track.reviewsRequested) - existingProCount
  );
  const proSlotsToReserve = Math.min(proShortfall, neededReviews);

  const proCandidates = eligibleUnique.filter((r) => r.tier === "PRO");
  const proToAssign = proCandidates.slice(0, Math.min(proSlotsToReserve, proCandidates.length));
  const proToAssignIds = new Set(proToAssign.map((r) => r.id));

  const nonProSlots = neededReviews - proSlotsToReserve;
  const additionalCandidates = eligibleUnique.filter(
    (r) => !proToAssignIds.has(r.id) && r.tier !== "PRO"
  );
  const additionalToAssign = additionalCandidates.slice(
    0,
    Math.min(nonProSlots, additionalCandidates.length)
  );

  const reviewersToAssign = [...proToAssign, ...additionalToAssign];

  // Create queue entries
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiration

  const priority =
    track.packageType === "PRO" || track.packageType === "DEEP_DIVE"
      ? 10
      : track.packageType === "STANDARD"
        ? 5
        : 0;

  await prisma.$transaction(async (tx) => {
    if (reviewersToAssign.length > 0) {
      await tx.reviewQueue.createMany({
        data: reviewersToAssign.map((reviewer) => ({
          trackId,
          reviewerId: reviewer.id,
          expiresAt,
          priority,
        })),
        skipDuplicates: true,
      });

      await tx.review.createMany({
        data: reviewersToAssign.map((reviewer) => ({
          trackId,
          reviewerId: reviewer.id,
          status: "ASSIGNED",
        })),
        skipDuplicates: true,
      });
    }

    const [completed, active] = await Promise.all([
      tx.review.count({ where: { trackId, status: "COMPLETED" } }),
      tx.review.count({
        where: { trackId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
    ]);

    const remaining = track.reviewsRequested - completed - active;

    if (remaining <= 0) {
      await tx.track.update({
        where: { id: trackId },
        data: { status: "IN_PROGRESS" },
      });
    }
  });
}

export async function expireAndReassignExpiredQueueEntries(): Promise<{
  expiredCount: number;
  affectedTrackCount: number;
}> {
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

  if (expired.length === 0) {
    return { expiredCount: 0, affectedTrackCount: 0 };
  }

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

  return { expiredCount: expired.length, affectedTrackCount: affectedTrackIds.size };
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
  if (totalReviews >= 50 && averageRating >= 4.7) {
    return "PRO" as unknown as ReviewerTier;
  }
  return getNonProTierValue();
}

// Update reviewer tier
export async function updateReviewerTier(reviewerId: string) {
  const reviewer = await prisma.reviewerProfile.findUnique({
    where: { id: reviewerId },
    include: { user: { select: { email: true } } },
  });

  if (!reviewer) return;

  const gemCount = reviewer.gemCount ?? 0;
  const newTier = gemCount >= 10
    ? ("PRO" as unknown as ReviewerTier)
    : calculateTier(reviewer.totalReviews, reviewer.averageRating);

  if (newTier !== reviewer.tier) {
    const tierRank = (tier: ReviewerTier) => (tier === "PRO" ? 2 : 1);
    const isUpgrade = tierRank(newTier) > tierRank(reviewer.tier);

    await prisma.reviewerProfile.update({
      where: { id: reviewerId },
      data: { tier: newTier },
    });

    if (isUpgrade && reviewer.user?.email) {
      await sendTierChangeEmail({
        to: reviewer.user.email,
        newTier,
        newRateCents: getTierRateCents(newTier),
      });
    }
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
