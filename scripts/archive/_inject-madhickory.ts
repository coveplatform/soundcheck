import { prisma } from "../../src/lib/prisma";

async function main() {
  const trackId = "cmptefh9r000004kwpxbyyaww";

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
    skip: 14,
  });

  if (!seed) { console.error("No seed available"); return; }
  console.log("Using seed:", seed.User.email);

  const bestPart = "Really liked this one. The energy is there from the start and it kept me listening the whole way through. Theres something genuinely unique about it that I dont come across that often.";
  const mainFeedback = "The main thing I noticed is the high end sounds a bit crowded in places, like the mid highs to low highs area gets a litle busy. Worth having a look at that I reckon, could realy clean up the mix nicely.";

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
      where: { id: trackId },
      data: { reviewsCompleted: { increment: 1 }, status: "COMPLETED" },
    });

    await tx.reviewQueue.deleteMany({
      where: { trackId, artistReviewerId: seed.id },
    });
  });

  console.log("Done — track COMPLETED");
  await prisma.$disconnect();
}
main().catch(console.error);
