import { prisma } from "../../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "thisisjupiterbyrd@gmail.com" },
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
    skip: 7,
  });

  if (!seed) { console.error("No seed available"); return; }
  console.log("Using seed:", seed.User.email);

  const bestPart = "Really good vibe on this one. There's a unique kinda energy that I dont get from most tracks and the song kept me hooked the whole way through honestly.";
  const mainFeedback = "The area around the mid highs to low highs sounds a litte busy up there to me. Maybe worth having a look at that, could realy open the mix up and let things breathe a bit more.";

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
