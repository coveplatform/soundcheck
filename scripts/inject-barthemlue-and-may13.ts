import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { sendReviewProgressEmail } from "../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TRACKS = [
  {
    trackId:     "cmps53qte000004l17guxhg9v",
    artistEmail: "farhandahir981@gmail.com",
    title:       "barthemlue 222",
    seed:        { name: "Joel Pierce",   email: "joelpierce@seed.mixreflect.com" },
    review: {
      firstImpression:      "STRONG_HOOK" as const,
      productionScore:      3, vocalScore: 4, originalityScore: 5,
      wouldListenAgain:     true,
      qualityLevel:         "ALMOST_THERE" as const,
      vocalClarity:         "CRYSTAL_CLEAR" as const,
      lowEndClarity:        "PERFECT" as const,
      highEndQuality:       "PERFECT" as const,
      stereoWidth:          "GOOD_BALANCE" as const,
      dynamics:             "GREAT_DYNAMICS" as const,
      trackLength:          "TOO_SHORT" as const,
      tooRepetitive:        false,
      playlistAction:       "ADD_TO_LIBRARY" as const,
      nextFocus:            "ARRANGEMENT" as const,
      bestPart:             "This is sick. The instrumentation is really cool and the whole thing has a lot of personality to it straight away.",
      biggestWeaknessSpecific: "Only thing I'd say is it needs more time to breathe. Each section has something interesting going on but they dont get enough room to fully land before it moves on. If the track was longer and let things develop a bit more this would be really something. Theres a lot of potential here.",
    },
  },
  {
    trackId:     "cmps2glm1000904jvjdqobgmn",
    artistEmail: "armrod49@gmail.com",
    title:       "May 13, 2026",
    seed:        { name: "Isla Ferreira", email: "islaferreira@seed.mixreflect.com" },
    review: {
      firstImpression:      "STRONG_HOOK" as const,
      productionScore:      3, vocalScore: 4, originalityScore: 5,
      wouldListenAgain:     true,
      qualityLevel:         "ALMOST_THERE" as const,
      vocalClarity:         "CRYSTAL_CLEAR" as const,
      lowEndClarity:        "PERFECT" as const,
      highEndQuality:       "PERFECT" as const,
      stereoWidth:          "GOOD_BALANCE" as const,
      dynamics:             "GREAT_DYNAMICS" as const,
      trackLength:          "TOO_SHORT" as const,
      tooRepetitive:        false,
      playlistAction:       "LET_PLAY" as const,
      nextFocus:            "ARRANGEMENT" as const,
      bestPart:             "Really like the instrumentation on this, it feels thought through. Theres a vibe here that pulls you in and keeps you there.",
      biggestWeaknessSpecific: "Feels like it ends just as its getting started. The sections dont quite get enough time to shine before the track wraps up. I think if you gave each part more space to develop you'd have somthing genuinely great on your hands. The bones are really strong, just needs room to grow.",
    },
  },
];

async function ensureSeed(s: { name: string; email: string }) {
  const user = await prisma.user.upsert({
    where: { email: s.email },
    update: {},
    create: { email: s.email, name: s.name, isArtist: true, isReviewer: false, emailVerified: new Date() },
  });
  const profile = await prisma.artistProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      artistName: s.name,
      completedOnboarding: true,
      reviewCredits: 0,
      reviewerExpertise: "INTERMEDIATE",
      experienceLevel: "INTERMEDIATE",
    },
  });
  return { id: profile.id, email: s.email };
}

async function main() {
  for (const t of TRACKS) {
    const track = await prisma.track.findUnique({
      where: { id: t.trackId },
      select: { reviewsCompleted: true, reviewsRequested: true },
    });
    if (!track) throw new Error(`Track not found: ${t.title}`);
    console.log(`\n${t.title}: ${track.reviewsCompleted}/${track.reviewsRequested}`);

    const seed = await ensureSeed(t.seed);

    const usedIds = (
      await prisma.review.findMany({
        where: { trackId: t.trackId },
        select: { peerReviewerArtistId: true },
      })
    ).map(r => r.peerReviewerArtistId).filter(Boolean) as string[];

    if (usedIds.includes(seed.id)) throw new Error(`Seed already used for ${t.title}`);

    const completed = track.reviewsCompleted + 1;
    const isNowComplete = completed >= track.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({ where: { trackId: t.trackId, artistReviewerId: seed.id } });
      await tx.review.create({
        data: {
          trackId: t.trackId,
          peerReviewerArtistId: seed.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId,
          listenDuration,
          firstImpression:         t.review.firstImpression,
          productionScore:         t.review.productionScore,
          vocalScore:              t.review.vocalScore,
          originalityScore:        t.review.originalityScore,
          wouldListenAgain:        t.review.wouldListenAgain,
          qualityLevel:            t.review.qualityLevel,
          vocalClarity:            t.review.vocalClarity,
          lowEndClarity:           t.review.lowEndClarity,
          highEndQuality:          t.review.highEndQuality,
          stereoWidth:             t.review.stereoWidth,
          dynamics:                t.review.dynamics,
          trackLength:             t.review.trackLength,
          tooRepetitive:           t.review.tooRepetitive,
          playlistAction:          t.review.playlistAction,
          nextFocus:               t.review.nextFocus,
          bestPart:                t.review.bestPart,
          biggestWeaknessSpecific: t.review.biggestWeaknessSpecific,
          weakestPart:             t.review.biggestWeaknessSpecific,
        },
      });
      await tx.track.update({
        where: { id: t.trackId },
        data: {
          reviewsCompleted: completed,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          ...(isNowComplete ? { completedAt: new Date() } : {}),
        },
      });
    });

    console.log(`[OK] ${seed.email} → ${completed}/${track.reviewsRequested}`);
    try {
      await sendReviewProgressEmail(t.artistEmail, t.title, completed, track.reviewsRequested);
      console.log(`  [EMAIL] ${isNowComplete ? "completion" : "progress"} → ${t.artistEmail}`);
    } catch (e) {
      console.error("  [EMAIL ERR]", e);
    }
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
