import { prisma } from "../src/lib/prisma";

// The review content to inject
const REVIEW = {
  firstImpression: "DECENT" as const,
  productionScore: 3,
  vocalScore: 4,
  originalityScore: 3,
  wouldListenAgain: false,
  bestPart:
    "The arrangement is solid and the track has a clear identity — it knows what it wants to be. Good energy in the right places and the structure keeps things moving. Originality is there too, doesn't sound like it's chasing anything.",
  weakestPart:
    "The low end is the main thing holding this back. The kick and bass are clashing in the low mids and it gets muddy pretty fast — you lose a lot of punch because of it. The high mids are also a bit harsh and fatiguing, like they haven't been reined in on some of the busier elements. Those two things together make the mix feel dense and tiring to listen through.",
  biggestWeaknessSpecific:
    "The low end is the main thing holding this back. The kick and bass are clashing in the low mids and it gets muddy pretty fast — you lose a lot of punch because of it. The high mids are also a bit harsh and fatiguing, like they haven't been reined in on some of the busier elements. Those two things together make the mix feel dense and tiring to listen through.",
  quickWin:
    "Carve some space between the kick and bass in the low mids — they're sitting on top of each other and a bit of separation there would open the whole mix up.",
  lowEndClarity: "BOTH_MUDDY" as const,
  vocalClarity: "CRYSTAL_CLEAR" as const,
  highEndQuality: "TOO_HARSH" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "TOO_COMPRESSED" as const,
  tooRepetitive: false,
  trackLength: "PERFECT" as const,
  playlistAction: "LET_PLAY" as const,
  qualityLevel: "ALMOST_THERE" as const,
  nextFocus: "MIXING" as const,
  listenDuration: 195,
  paidAmount: 0,
  isPeerReview: true,
  status: "COMPLETED" as const,
  countsTowardCompletion: true,
  countsTowardAnalytics: true,
  reviewSchemaVersion: 2,
};

// Target tracks by artist email
const TARGET_EMAILS = [
  "aaronjohnston1970@gmail.com",
  "deliarainone@gmail.com",
  "zekeyeagerbestie@gmail.com",
  "47hlly@gmail.com",
  "a.heber@gmx.de",
  "djmackintime@gmail.com",
];

async function main() {
  // Find a seed reviewer artist profile to attribute reviews to
  // Using the admin/seed account
  const reviewer = await prisma.artistProfile.findFirst({
    where: {
      User: {
        email: { endsWith: "@seed.mixreflect.com" },
      },
    },
    select: { id: true, User: { select: { email: true } } },
  });

  if (!reviewer) {
    console.error("No seed reviewer found. Looking for any admin account...");
    const adminReviewer = await prisma.artistProfile.findFirst({
      where: {
        User: {
          email: {
            in: ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"],
          },
        },
      },
      select: { id: true, User: { select: { email: true } } },
    });
    if (!adminReviewer) {
      console.error("No reviewer found to attribute reviews to. Aborting.");
      process.exit(1);
    }
    console.log(`Using reviewer: ${adminReviewer.User.email}`);
    await injectReviews(adminReviewer.id);
  } else {
    console.log(`Using seed reviewer: ${reviewer.User.email}`);
    await injectReviews(reviewer.id);
  }

  await prisma.$disconnect();
}

async function injectReviews(reviewerArtistId: string) {
  for (const email of TARGET_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ArtistProfile: {
          select: {
            id: true,
            Track: {
              where: { packageType: "PEER", status: { in: ["QUEUED", "IN_PROGRESS"] } },
              select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const track = user?.ArtistProfile?.Track?.[0];
    if (!track) {
      console.log(`  ✗ No active PEER track found for ${email}`);
      continue;
    }

    // Skip if reviewer is the track owner
    if (user?.ArtistProfile?.id === reviewerArtistId) {
      console.log(`  ✗ Skipping ${email} — reviewer owns this track`);
      continue;
    }

    // Check for existing review from this reviewer
    const existing = await prisma.review.findUnique({
      where: { trackId_peerReviewerArtistId: { trackId: track.id, peerReviewerArtistId: reviewerArtistId } },
    });

    if (existing) {
      console.log(`  ✗ Review already exists for "${track.title}" by this reviewer`);
      continue;
    }

    // Check capacity
    const activeCount = await prisma.review.count({
      where: {
        trackId: track.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
        countsTowardCompletion: true,
      },
    });

    if (activeCount >= track.reviewsRequested) {
      console.log(`  ✗ "${track.title}" already has ${activeCount}/${track.reviewsRequested} reviews — full`);
      continue;
    }

    // Create the review
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          trackId: track.id,
          peerReviewerArtistId: reviewerArtistId,
          ...REVIEW,
        },
      });

      // Update track counters and status
      const newCompleted = track.reviewsCompleted + 1;
      const isNowDone = newCompleted >= track.reviewsRequested;

      await tx.track.update({
        where: { id: track.id },
        data: {
          reviewsCompleted: { increment: 1 },
          status: isNowDone ? "COMPLETED" : "IN_PROGRESS",
          completedAt: isNowDone ? new Date() : undefined,
        },
      });

      // Clean up any ReviewQueue entry for this reviewer+track
      await tx.reviewQueue.deleteMany({
        where: { trackId: track.id, artistReviewerId: reviewerArtistId },
      });
    });

    console.log(`  ✓ Injected review for "${track.title}" (${email})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
