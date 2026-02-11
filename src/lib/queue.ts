import { prisma } from "./prisma";
import { PackageType, ReviewerTier } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { sendTierChangeEmail } from "@/lib/email";
import { PACKAGES } from "@/lib/metadata";

const MIN_REVIEWER_ACCOUNT_AGE_HOURS = Number(
  process.env.MIN_REVIEWER_ACCOUNT_AGE_HOURS ?? "24"
);

// Test reviewer emails that bypass genre matching and wait time
export const TEST_REVIEWER_EMAILS = [
  "davo2@mixreflect.com",
  "simli@mixreflect.com",
  "roserncliff@mixreflect.com",
  "marcust@mixreflect.com",
  "beatsbyjay@mixreflect.com",
  "synthqueen@mixreflect.com",
  "kiram@mixreflect.com",
  "deepgroove@mixreflect.com",
  "tomwilson@mixreflect.com",
  "nightowl99@mixreflect.com",
  "lilly81095@gmail.com",
  "imogengravina@gmail.com",
  "a.engelhardt101@gmail.com",
  "millersport98@gmail.com",
  "pash.tzaikos@gmail.com",
  "testreviewer@mixreflect.com",
];

// Parent genre slugs mapped to their child slugs for hierarchical matching
const GENRE_HIERARCHY: Record<string, string[]> = {
  electronic: [
    "house", "deep-house", "progressive-house", "techno", "hard-techno",
    "drum-and-bass", "dubstep", "trance", "ambient", "edm", "synthwave",
    "lo-fi", "future-bass",
  ],
  "hip-hop-rnb": ["hip-hop", "trap", "rnb", "boom-bap", "drill"],
  "rock-metal": ["rock", "indie-rock", "alternative", "metal", "punk"],
  "pop-dance": ["pop", "indie-pop", "electropop", "synth-pop"],
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
async function expandGenresForMatchingWithDb(
  db: Prisma.TransactionClient | typeof prisma,
  genreIds: string[]
): Promise<string[]> {
  // Get the genres from the database to know their slugs
  const genres = await db.genre.findMany({
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
  const expandedGenres = await db.genre.findMany({
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

// PRO tier requirements
export const PRO_TIER_MIN_REVIEWS = 25;
export const PRO_TIER_MIN_RATING = 4.5;

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
  _packageType: PackageType,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const track = await db.track.findUnique({
    where: { id: trackId },
    include: { Genre: true },
  });

  if (!track) return [];

  const trackGenreIds = track.Genre.map((g) => g.id);

  // Expand genres to include parent/child relationships for matching
  // e.g., track with "deep-house" will match reviewers with "electronic" OR "deep-house"
  const genreIds = await expandGenresForMatchingWithDb(db, trackGenreIds);

  const bypassPayments =
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_PAYMENTS === "true";

  const minAccountAgeHours = bypassPayments ? 0 : MIN_REVIEWER_ACCOUNT_AGE_HOURS;

  const cutoff = new Date();
  cutoff.setHours(
    cutoff.getHours() -
      (Number.isFinite(minAccountAgeHours) ? minAccountAgeHours : 24)
  );

  // Regular reviewers: must match genre and meet account age requirement
  const regularWhere: Prisma.ReviewerProfileWhereInput = {
    completedOnboarding: true,
    onboardingQuizPassed: true,
    isRestricted: false,
    User: {
      createdAt: {
        lte: cutoff,
      },
      // Exclude test accounts from this query (they're handled separately)
      email: {
        notIn: TEST_REVIEWER_EMAILS,
      },
    },
    Genre: {
      some: {
        id: { in: genreIds },
      },
    },
    Review: {
      none: {
        trackId: track.id,
      },
    },
    ReviewQueue: {
      none: {
        trackId: track.id,
      },
    },
  };

  // Test reviewers: NO genre restriction, NO account age requirement
  const testWhere: Prisma.ReviewerProfileWhereInput = {
    completedOnboarding: true,
    onboardingQuizPassed: true,
    isRestricted: false,
    User: {
      email: {
        in: TEST_REVIEWER_EMAILS,
      },
    },
    // Still exclude if they've already reviewed this track
    Review: {
      none: {
        trackId: track.id,
      },
    },
    ReviewQueue: {
      none: {
        trackId: track.id,
      },
    },
  };

  // Fetch both regular and test reviewers
  const [regularReviewers, testReviewers] = await Promise.all([
    db.reviewerProfile.findMany({
      where: regularWhere,
      include: {
        Genre: true,
        User: { select: { id: true, email: true } },
      },
      orderBy: [
        { tier: "desc" },
        { averageRating: "desc" },
      ],
    }),
    db.reviewerProfile.findMany({
      where: testWhere,
      include: {
        Genre: true,
        User: { select: { id: true, email: true } },
      },
      orderBy: [
        { tier: "desc" },
        { averageRating: "desc" },
      ],
    }),
  ]);

  // Combine and deduplicate (test reviewers first for priority)
  const seenIds = new Set<string>();
  const eligibleReviewers = [...testReviewers, ...regularReviewers].filter((r) => {
    if (seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
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

/**
 * Get eligible peer reviewers (ArtistProfile) for a PEER package track.
 * Matches on reviewGenres, excludes the track owner.
 */
export async function getEligiblePeerReviewers(
  trackId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const track = await db.track.findUnique({
    where: { id: trackId },
    include: {
      Genre: true,
      ArtistProfile: { select: { id: true, userId: true } },
    },
  });

  if (!track) return [];

  const trackGenreIds = track.Genre.map((g) => g.id);
  const genreIds = await expandGenresForMatchingWithDb(db, trackGenreIds);

  // Find artist profiles that:
  // 1. Have completed onboarding
  // 2. Have matching review genres
  // 3. Are NOT the track owner
  // 4. Haven't already reviewed this track
  const peerReviewers = await db.artistProfile.findMany({
    where: {
      completedOnboarding: true,
      // Exclude the track owner
      id: { not: track.ArtistProfile.id },
      // Must have matching review genres
      Genre_ArtistReviewGenres: {
        some: {
          id: { in: genreIds },
        },
      },
      // Exclude if already assigned as peer reviewer for this track
      Review: {
        none: {
          trackId: track.id,
        },
      },
      ReviewQueue: {
        none: {
          trackId: track.id,
        },
      },
      User: {},
    },
    include: {
      Genre_ArtistReviewGenres: true,
      User: { select: { id: true, email: true } },
    },
    orderBy: [
      { totalPeerReviews: "desc" },
      { peerReviewRating: "desc" },
    ],
  });

  return peerReviewers;
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

  const concurrency = Number(process.env.ASSIGNMENT_CONCURRENCY ?? "5");
  const batchSize = Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 5;

  for (let i = 0; i < tracks.length; i += batchSize) {
    await Promise.all(
      tracks.slice(i, i + batchSize).map((t) => assignReviewersToTrack(t.id))
    );
  }
}

// Assign reviewers to a track
export async function assignReviewersToTrack(trackId: string) {
  await prisma.$transaction(async (tx) => {
    // Prevent concurrent assignments for the same track
    // (uses transaction-scoped advisory lock)
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${trackId}), hashtext(${trackId} || ':assign'))
    `;

    const track = await tx.track.findUnique({
      where: { id: trackId },
      include: {
        Review: {
          select: {
            reviewerId: true,
            status: true,
            ReviewerProfile: {
              select: {
                tier: true,
              },
            },
          },
        },
        ReviewQueue: true,
      },
    });

    if (!track || (track.status !== "QUEUED" && track.status !== "IN_PROGRESS")) {
      return;
    }

    const [countedCompletedReviews, activeAssignments] = await Promise.all([
      tx.review.count({
        where: {
          trackId,
          status: "COMPLETED",
          countsTowardCompletion: true,
        },
      }),
      tx.review.count({
        where: { trackId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
    ]);

    const countedStatuses = new Set(["ASSIGNED", "IN_PROGRESS", "COMPLETED"]);
    const existingProCount = track.Review.filter(
      (r) => countedStatuses.has(r.status) && r.ReviewerProfile?.tier === "PRO"
    ).length;

    const neededReviews =
      track.reviewsRequested - countedCompletedReviews - activeAssignments;

    if (neededReviews <= 0) return;

    // PEER package: assign ArtistProfile peer reviewers
    // Legacy packages: assign ReviewerProfile reviewers
    const isPeerPackage = track.packageType === "PEER";

    if (isPeerPackage) {
      // PEER tracks use a claim model: users browse available tracks in /review
      // and claim them on-click via POST /api/reviews/claim.
      // No proactive assignment needed.
      return;
    } else {
      // Legacy flow for STARTER/STANDARD/PRO/DEEP_DIVE packages
      const eligibleReviewers = await getEligibleReviewers(
        trackId,
        track.packageType,
        tx
      );

      const existingReviewerIds = new Set(track.Review.map((r: any) => r.reviewerId));
      const eligibleUnique = eligibleReviewers.filter(
        (r) => !existingReviewerIds.has(r.id)
      );

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
      const proToAssign = proCandidates.slice(
        0,
        Math.min(proSlotsToReserve, proCandidates.length)
      );
      const proToAssignIds = new Set(proToAssign.map((r) => r.id));

      const unfilledProSlots = proSlotsToReserve - proToAssign.length;
      const nonProSlots = neededReviews - proSlotsToReserve + unfilledProSlots;

      const additionalCandidates = eligibleUnique.filter(
        (r) => !proToAssignIds.has(r.id) && r.tier !== "PRO"
      );
      const additionalToAssign = additionalCandidates.slice(
        0,
        Math.min(nonProSlots, additionalCandidates.length)
      );

      const reviewersToAssign = [...proToAssign, ...additionalToAssign];

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const priority =
        track.packageType === "PRO" || track.packageType === "DEEP_DIVE"
          ? 10
          : track.packageType === "STANDARD"
            ? 5
            : 0;

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
    }

    // Track.status is not updated here.
    // IN_PROGRESS means at least one review has been submitted.
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
      artistReviewerId: true,
    },
  });

  if (expired.length === 0) {
    return { expiredCount: 0, affectedTrackCount: 0 };
  }

  const affectedTrackIds = Array.from(new Set(expired.map((e) => e.trackId)));

  // Build match conditions: legacy uses reviewerId, peer uses peerReviewerArtistId/artistReviewerId
  const reviewOr = expired.map((e) =>
    e.reviewerId
      ? { trackId: e.trackId, reviewerId: e.reviewerId }
      : { trackId: e.trackId, peerReviewerArtistId: e.artistReviewerId! }
  );
  const queueOr = expired.map((e) =>
    e.reviewerId
      ? { trackId: e.trackId, reviewerId: e.reviewerId }
      : { trackId: e.trackId, artistReviewerId: e.artistReviewerId! }
  );

  const chunkSize = 200;
  for (let i = 0; i < reviewOr.length; i += chunkSize) {
    const reviewChunk = reviewOr.slice(i, i + chunkSize);
    const queueChunk = queueOr.slice(i, i + chunkSize);

    await prisma.$transaction(async (tx) => {
      await tx.review.updateMany({
        where: {
          OR: reviewChunk,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        data: { status: "EXPIRED" },
      });

      await tx.reviewQueue.deleteMany({
        where: {
          OR: queueChunk,
        },
      });
    });
  }

  const concurrency = Number(process.env.ASSIGNMENT_CONCURRENCY ?? "5");
  const batchSize = Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 5;

  for (let i = 0; i < affectedTrackIds.length; i += batchSize) {
    await Promise.all(
      affectedTrackIds
        .slice(i, i + batchSize)
        .map((trackId) => assignReviewersToTrack(trackId))
    );
  }

  return {
    expiredCount: expired.length,
    affectedTrackCount: affectedTrackIds.length,
  };
}

// Assign all available tracks to a test reviewer (bypasses genre matching)
export async function assignTracksToTestReviewer(reviewerId: string, email: string) {
  // Only run for test accounts
  if (!TEST_REVIEWER_EMAILS.includes(email.toLowerCase())) {
    return;
  }

  // Get all queued/in-progress tracks that this reviewer hasn't been assigned to
  const availableTracks = await prisma.track.findMany({
    where: {
      status: { in: ["QUEUED", "IN_PROGRESS"] },
      Review: {
        none: {
          reviewerId,
        },
      },
      ReviewQueue: {
        none: {
          reviewerId,
        },
      },
    },
    select: { id: true, reviewsRequested: true },
    orderBy: { createdAt: "desc" },
    take: 20, // Limit to 20 tracks at a time
  });

  if (availableTracks.length === 0) return;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  // Assign test reviewer to each available track
  for (const track of availableTracks) {
    try {
      await prisma.$transaction(async (tx) => {
        // Check if already assigned (race condition protection)
        const existing = await tx.review.findFirst({
          where: { trackId: track.id, reviewerId },
        });
        if (existing) return;

        // Create queue entry and review
        await tx.reviewQueue.create({
          data: {
            trackId: track.id,
            reviewerId,
            expiresAt,
            priority: 10, // High priority for test reviewers
          },
        });

        await tx.review.create({
          data: {
            trackId: track.id,
            reviewerId,
            status: "ASSIGNED",
          },
        });
      });
    } catch {
      // Skip if duplicate or other error
    }
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
      Track: {
        include: {
          Genre: true,
          ArtistProfile: true,
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
  if (totalReviews >= PRO_TIER_MIN_REVIEWS && averageRating >= PRO_TIER_MIN_RATING) {
    return "PRO" as unknown as ReviewerTier;
  }
  return getNonProTierValue();
}

// Calculate tier for peer reviewers (ArtistProfile-based)
export function isPeerReviewerPro(
  totalPeerReviews: number,
  peerReviewRating: number
): boolean {
  return totalPeerReviews >= PRO_TIER_MIN_REVIEWS && peerReviewRating >= PRO_TIER_MIN_RATING;
}

// Update reviewer tier
export async function updateReviewerTier(reviewerId: string | null) {
  if (!reviewerId) return; // Peer reviews don't have ReviewerProfile
  const reviewer = await prisma.reviewerProfile.findUnique({
    where: { id: reviewerId },
    include: { User: { select: { email: true } } },
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

    if (isUpgrade && reviewer.User?.email) {
      await sendTierChangeEmail({
        to: reviewer.User.email,
        newTier,
        newRateCents: getTierRateCents(newTier),
      });
    }
  }
}

export async function updateReviewerAverageRating(reviewerId: string | null) {
  if (!reviewerId) return; // Peer reviews don't have ReviewerProfile
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
