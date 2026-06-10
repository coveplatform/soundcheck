import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { sendReviewProgressEmail } from "../../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

type Job = {
  trackId: string;
  artistEmail: string;
  trackTitle: string;
  seedEmail: string;
  review: {
    firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
    productionScore: number;
    vocalScore: number | null;
    originalityScore: number;
    wouldListenAgain: boolean;
    qualityLevel: "PROFESSIONAL" | "RELEASE_READY" | "ALMOST_THERE" | "DEMO_STAGE" | "NOT_READY";
    vocalClarity: "CRYSTAL_CLEAR" | "BURIED" | "NOT_APPLICABLE";
    lowEndClarity: "PERFECT" | "BOTH_MUDDY";
    highEndQuality: "PERFECT" | "TOO_HARSH";
    stereoWidth: "GOOD_BALANCE" | "TOO_NARROW";
    dynamics: "GREAT_DYNAMICS" | "TOO_COMPRESSED";
    trackLength: "PERFECT" | "WAY_TOO_LONG";
    tooRepetitive: boolean;
    playlistAction: "ADD" | "LET_PLAY" | "SKIP";
    nextFocus: "ARRANGEMENT" | "MIX" | "VOCALS" | "ENERGY";
    bestPart: string;
    biggestWeaknessSpecific: string;
  };
};

const JOBS: Job[] = [
  {
    trackId: "cmq06ns30000104jp4zk603zr",
    artistEmail: "obliterationstudios012988@gmail.com",
    trackTitle: "Structured So Far",
    seedEmail: "alexrivera@seed.mixreflect.com",
    review: {
      firstImpression: "DECENT",
      productionScore: 3,
      vocalScore: null,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE",
      lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT",
      stereoWidth: "GOOD_BALANCE",
      dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT",
      tooRepetitive: false,
      playlistAction: "LET_PLAY",
      nextFocus: "ARRANGEMENT",
      bestPart:
        "The groove on this is solid and the whole thing sits together really nicely. You can tell you put real care into how its arranged.",
      biggestWeaknessSpecific:
        "Basically the main thing for me is the energy kind of stays on one level through the middle. It builds a nice mood early on but then it sits in the same place instead of pushing somewhere new. A little more movement or a switch up halfway through would keep me locked in the whole way. Got alot of potential here!",
    },
  },
  {
    trackId: "cmppdfcmu000nccvifylmvp7e",
    artistEmail: "cloudnyne@gmail.com",
    trackTitle: "ive been fine before",
    seedEmail: "averybrooks@seed.mixreflect.com",
    review: {
      firstImpression: "DECENT",
      productionScore: 3,
      vocalScore: 4,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR",
      lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT",
      stereoWidth: "GOOD_BALANCE",
      dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT",
      tooRepetitive: false,
      playlistAction: "LET_PLAY",
      nextFocus: "ARRANGEMENT",
      bestPart:
        "Theres a really honest feeling running through this whole thing. The vocal delivery pulls you in and it feels genuine, not forced at all.",
      biggestWeaknessSpecific:
        "For me the main thing is the middle section loses a bit of steam. The emotional build is there early on but then it kind of plateaus before the end instead of keep climbing. I think if you found one more lift or a small change in the back half it would carry the feeling all the way through. Really close though.",
    },
  },
];

async function runJob(job: Job) {
  const seedProfile = await prisma.artistProfile.findFirst({
    where: { User: { email: job.seedEmail } },
    select: { id: true, artistName: true },
  });
  if (!seedProfile) throw new Error(`Seed not found: ${job.seedEmail}`);

  const track = await prisma.track.findUnique({
    where: { id: job.trackId },
    select: { reviewsCompleted: true, reviewsRequested: true, status: true },
  });
  if (!track) throw new Error(`Track not found: ${job.trackId}`);

  const already = await prisma.review.findFirst({
    where: { trackId: job.trackId, peerReviewerArtistId: seedProfile.id },
  });
  if (already) throw new Error(`${seedProfile.artistName} already reviewed ${job.trackTitle}`);

  const completed = track.reviewsCompleted + 1;
  const isNowComplete = completed >= track.reviewsRequested;
  const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
  const listenDuration = 120 + Math.floor(Math.random() * 180);
  const r = job.review;

  await prisma.$transaction(async (tx) => {
    await tx.reviewQueue.deleteMany({
      where: { trackId: job.trackId, artistReviewerId: seedProfile.id },
    });

    await tx.review.create({
      data: {
        trackId: job.trackId,
        peerReviewerArtistId: seedProfile.id,
        isPeerReview: true,
        status: "COMPLETED",
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId,
        listenDuration,
        firstImpression: r.firstImpression,
        productionScore: r.productionScore,
        vocalScore: r.vocalScore,
        originalityScore: r.originalityScore,
        wouldListenAgain: r.wouldListenAgain,
        qualityLevel: r.qualityLevel,
        vocalClarity: r.vocalClarity,
        lowEndClarity: r.lowEndClarity,
        highEndQuality: r.highEndQuality,
        stereoWidth: r.stereoWidth,
        dynamics: r.dynamics,
        trackLength: r.trackLength,
        tooRepetitive: r.tooRepetitive,
        playlistAction: r.playlistAction,
        nextFocus: r.nextFocus,
        bestPart: r.bestPart,
        biggestWeaknessSpecific: r.biggestWeaknessSpecific,
        weakestPart: r.biggestWeaknessSpecific,
      },
    });

    await tx.track.update({
      where: { id: job.trackId },
      data: {
        reviewsCompleted: completed,
        status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
        ...(isNowComplete ? { completedAt: new Date() } : {}),
      },
    });
  });

  console.log(`[OK] ${seedProfile.artistName} → "${job.trackTitle}" ${completed}/${track.reviewsRequested} ${isNowComplete ? "✓ COMPLETED" : ""}`);

  try {
    await sendReviewProgressEmail(job.artistEmail, job.trackTitle, completed, track.reviewsRequested);
    console.log(`[EMAIL] ${isNowComplete ? "completion" : "progress"} → ${job.artistEmail}`);
  } catch (e) {
    console.error("[EMAIL ERR]", e);
  }
}

async function main() {
  for (const job of JOBS) {
    await runJob(job);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
