import { prisma } from "../../src/lib/prisma";

async function main() {
  const trackId = "cmptjsd00000004jr7t32tc4t";

  const existing = await prisma.review.findMany({
    where: { trackId },
    select: { peerReviewerArtistId: true },
  });
  const usedIds = existing.map(r => r.peerReviewerArtistId).filter(Boolean) as string[];

  const seed = await prisma.artistProfile.findFirst({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
      id: { notIn: usedIds },
    },
    select: { id: true, User: { select: { email: true } } },
    skip: 4,
  });

  if (!seed) { console.error("No seed available"); return; }
  console.log("Using seed:", seed.User.email, seed.id);

  const bestPart = "Really good vibe on this one. Theres a unique kinda energy that I dont really get from most tracks and the song keeps me hooked the whole way through.";
  const mainFeedback = "The mid highs to low highs area sounds a litte busy up there. Maybe worth cleaning that up a bit I think, could realy open the mix up and let everything breathe more.";

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        trackId,
        peerReviewerArtistId: seed.id,
        isPeerReview: true,
        status: "COMPLETED",
        reviewSchemaVersion: 3,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,

        // Scores
        qualityLevel: "ALMOST_THERE",
        productionScore: 3,
        firstImpression: "STRONG_HOOK",
        originalityScore: 5,
        vocalScore: 4,

        // Technical
        lowEndClarity: "PERFECT",
        vocalClarity: "CRYSTAL_CLEAR",
        highEndQuality: "TOO_HARSH",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        tooRepetitive: false,
        trackLength: "PERFECT",

        // Written
        bestPart,
        biggestWeaknessSpecific: mainFeedback,
        weakestPart: mainFeedback,
        quickWin: null,
        nextFocus: "MIXING",
      },
    });

    await tx.track.update({
      where: { id: trackId },
      data: { reviewsCompleted: { increment: 1 }, status: "COMPLETED" },
    });

    await tx.reviewQueue.deleteMany({
      where: { trackId, artistReviewerId: seed.id },
    });
  });

  console.log("Done — review injected for Nocturnal Solace");
  await prisma.$disconnect();
}
main().catch(console.error);
