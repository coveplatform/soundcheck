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

const TRACK_ID     = "cmq00t11h000104l8da39tau6";
const ARTIST_EMAIL = "madargask@gmail.com";
const TRACK_TITLE  = "Nullevor - First Snow (Slowed + Reverb)";

const SEED = { name: "ElenaFrost", email: "elenafrost@seed.mixreflect.com" };

const REVIEW = {
  firstImpression: "DECENT" as const,
  productionScore: 3,
  vocalScore: null,
  originalityScore: 3,
  wouldListenAgain: true,
  qualityLevel: "ALMOST_THERE" as const,
  vocalClarity: "NOT_APPLICABLE" as const,
  lowEndClarity: "PERFECT" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  trackLength: "PERFECT" as const,
  tooRepetitive: false,
  playlistAction: "ADD_TO_LIBRARY" as const,
  nextFocus: "ARRANGEMENT" as const,
  bestPart: "Honestly the mood you built here is gorgeous. The whole thing feels like floating, really dreamy and calm, and the reverb gives it this big spacious feeling that suits the slowed vibe perfectly. Easy to get lost in it.",
  biggestWeaknessSpecific: "For me the one thing would be the arrangement at the ends of your sections. Right now they kind of roll into each other in a pretty similar way the whole way through. I think if you let the reverb tails ring out a little longer right at the end of a section before the next part comes in, it would create more of that ebb and flow and make the transitions feel more dynamic. Also pulling a few elements back going into a section would help it breathe more. Small stuff though, the core vibe is already really nice and somthing people will sink right into.",
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
