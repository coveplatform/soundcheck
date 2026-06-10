import { prisma } from "../../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "musicforfunfun@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
            select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true },
          },
        },
      },
    },
  });

  const track = user?.ArtistProfile?.Track?.[0];
  if (!track) { console.error("No active track found"); return; }
  console.log("Track:", track.title, track.id, `${track.reviewsCompleted}/${track.reviewsRequested}`);

  const existing = await prisma.review.findMany({
    where: { trackId: track.id },
    select: { peerReviewerArtistId: true },
  });
  const usedIds = existing.map(r => r.peerReviewerArtistId).filter(Boolean) as string[];

  const seed = await prisma.artistProfile.findFirst({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
      id: { notIn: usedIds },
    },
    select: { id: true, User: { select: { email: true } } },
    skip: 11,
  });

  if (!seed) { console.error("No seed available"); return; }
  console.log("Using seed:", seed.User.email);

  const bestPart = "Nice vibe on this, I really enjoyed it. Unique energy to it that I dont hear that often and the track kept me hooked all the way through no problem.";
  const mainFeedback = "The one thing I noticed is the mid highs to low highs area sounds a litte busy up there. Could be worth looking at that cause I think it would realy open the mix up nicely.";

  const willComplete = track.reviewsCompleted + 1 >= track.reviewsRequested;

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        trackId: track.id,
        peerReviewerArtistId: seed.id,
        isPeerReview: true,
        status: "COMPLETED",
        reviewSchemaVersion: 3,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,

        qualityLevel: "ALMOST_THERE",
        productionScore: 3,
        firstImpression: "STRONG_HOOK",
        originalityScore: 5,
        vocalScore: 4,

        lowEndClarity: "PERFECT",
        vocalClarity: "CRYSTAL_CLEAR",
        highEndQuality: "TOO_HARSH",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        tooRepetitive: false,
        trackLength: "PERFECT",

        bestPart,
        biggestWeaknessSpecific: mainFeedback,
        weakestPart: mainFeedback,
        quickWin: null,
        nextFocus: "MIXING",
      },
    });

    await tx.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: { increment: 1 },
        status: willComplete ? "COMPLETED" : "IN_PROGRESS",
      },
    });

    await tx.reviewQueue.deleteMany({
      where: { trackId: track.id, artistReviewerId: seed.id },
    });
  });

  console.log("Done —", track.title, willComplete ? "(COMPLETED)" : "(still in progress)");
  await prisma.$disconnect();
}
main().catch(console.error);
