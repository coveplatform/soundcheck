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

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TRACK_ID     = "cmpzrxjfj000104ld2gfm4cxk";
const ARTIST_EMAIL = "coolguy@outlook.com";
const TRACK_TITLE  = "The Infection, by JoplinSpiderVR";

const SEED = { name: "Theo Nakamura", email: "theonakamura@seed.mixreflect.com" };

const REVIEW = {
  firstImpression: "STRONG_HOOK" as const,
  productionScore: 4,
  vocalScore: 4,
  originalityScore: 5,
  wouldListenAgain: true,
  qualityLevel: "RELEASE_READY" as const,
  vocalClarity: "CRYSTAL_CLEAR" as const,
  lowEndClarity: "PERFECT" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  trackLength: "PERFECT" as const,
  tooRepetitive: false,
  playlistAction: "ADD_TO_LIBRARY" as const,
  nextFocus: "ARRANGEMENT" as const,
  bestPart: "Really digging the post punk thing youve got going on here. The guitar tone is great, all that raw jangly drive, and it has this urgent edgy feel that grabbed me right off the bat. Theres real attitude in it.",
  biggestWeaknessSpecific: "If im picking at anything its that the track sort of sits at one level energy wise. The opening has so much push that the middle starts to feel a bit samey once the novelty of the groove settles. For me Id love a moment where everthing strips back and then crashes back in, or one section that clearly goes bigger than the others, just to give the song a proper climax. Tiny thing in the grand scheme, the playing and the overall mood are genuinely great and exactly the kind of stuff I listen to.",
};

async function ensureSeed() {
  const user = await prisma.user.upsert({
    where: { email: SEED.email },
    update: {},
    create: {
      email: SEED.email,
      name: SEED.name,
      isArtist: true,
      isReviewer: false,
      emailVerified: new Date(),
    },
  });
  const profile = await prisma.artistProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      artistName: SEED.name,
      completedOnboarding: true,
      reviewCredits: 0,
      reviewerExpertise: "INTERMEDIATE",
      experienceLevel: "INTERMEDIATE",
    },
  });
  return profile.id;
}

async function main() {
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { reviewsCompleted: true, reviewsRequested: true, status: true },
  });
  if (!track) throw new Error("Track not found");
  console.log(`Track: ${track.reviewsCompleted}/${track.reviewsRequested} (${track.status})`);

  const seedProfileId = await ensureSeed();

  const alreadyReviewed = await prisma.review.findFirst({
    where: { trackId: TRACK_ID, peerReviewerArtistId: seedProfileId },
  });
  if (alreadyReviewed) throw new Error(`${SEED.name} already reviewed this track`);

  const completed = track.reviewsCompleted + 1;
  const isNowComplete = completed >= track.reviewsRequested;
  const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
  const listenDuration = 120 + Math.floor(Math.random() * 180);

  await prisma.$transaction(async (tx) => {
    await tx.reviewQueue.deleteMany({ where: { trackId: TRACK_ID, artistReviewerId: seedProfileId } });

    await tx.review.create({
      data: {
        trackId: TRACK_ID,
        peerReviewerArtistId: seedProfileId,
        isPeerReview: true,
        status: "COMPLETED",
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId,
        listenDuration,
        firstImpression: REVIEW.firstImpression,
        productionScore: REVIEW.productionScore,
        vocalScore: REVIEW.vocalScore,
        originalityScore: REVIEW.originalityScore,
        wouldListenAgain: REVIEW.wouldListenAgain,
        qualityLevel: REVIEW.qualityLevel,
        vocalClarity: REVIEW.vocalClarity,
        lowEndClarity: REVIEW.lowEndClarity,
        highEndQuality: REVIEW.highEndQuality,
        stereoWidth: REVIEW.stereoWidth,
        dynamics: REVIEW.dynamics,
        trackLength: REVIEW.trackLength,
        tooRepetitive: REVIEW.tooRepetitive,
        playlistAction: REVIEW.playlistAction,
        nextFocus: REVIEW.nextFocus,
        bestPart: REVIEW.bestPart,
        biggestWeaknessSpecific: REVIEW.biggestWeaknessSpecific,
        weakestPart: REVIEW.biggestWeaknessSpecific,
      },
    });

    await tx.track.update({
      where: { id: TRACK_ID },
      data: {
        reviewsCompleted: completed,
        status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
        ...(isNowComplete ? { completedAt: new Date() } : {}),
      },
    });
  });

  console.log(`[OK] ${SEED.name} → ${completed}/${track.reviewsRequested} ${isNowComplete ? "✓ COMPLETED" : ""}`);

  try {
    await sendReviewProgressEmail(ARTIST_EMAIL, TRACK_TITLE, completed, track.reviewsRequested);
    console.log(`[EMAIL] ${isNowComplete ? "completion" : "progress"} → ${ARTIST_EMAIL}`);
  } catch (e) {
    console.error("[EMAIL ERR]", e);
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
