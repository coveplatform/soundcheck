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

const TRACK_ID = "cmp90y84r000004l8pf3eik1m";
const ARTIST_EMAIL = "darrmaddux@gmail.com";
const TRACK_TITLE = "YEAT";

const SEED_POOL = [
  { name: "Alex Rivera",   email: "alexrivera@seed.mixreflect.com"   },
  { name: "Maya Chen",     email: "mayachen@seed.mixreflect.com"     },
  { name: "Jordan Wells",  email: "jordanwells@seed.mixreflect.com"  },
  { name: "Sam Torres",    email: "samtorres@seed.mixreflect.com"    },
  { name: "Casey Morgan",  email: "caseymorgan@seed.mixreflect.com"  },
  { name: "Jamie Park",    email: "jamiepark@seed.mixreflect.com"    },
  { name: "Riley Evans",   email: "rileyevans@seed.mixreflect.com"   },
  { name: "Quinn Adams",   email: "quinnadams@seed.mixreflect.com"   },
  { name: "Avery Brooks",  email: "averybrooks@seed.mixreflect.com"  },
  { name: "Drew Mitchell", email: "drewmitchell@seed.mixreflect.com" },
  { name: "Logan Reed",    email: "loganreed@seed.mixreflect.com"    },
  { name: "Blake Carter",  email: "blakecarter@seed.mixreflect.com"  },
  { name: "Taylor Hayes",  email: "taylorhayes@seed.mixreflect.com"  },
  { name: "Jesse Kim",     email: "jessekim@seed.mixreflect.com"     },
  { name: "Reese Cooper",  email: "reesecooper@seed.mixreflect.com"  },
  { name: "Skyler Walsh",  email: "skylerwalsh@seed.mixreflect.com"  },
  { name: "Cameron Bell",  email: "cameronbell@seed.mixreflect.com"  },
  { name: "Peyton Flores", email: "peytonflores@seed.mixreflect.com" },
  { name: "Finley Ross",   email: "finleyross@seed.mixreflect.com"   },
  { name: "Dakota Lee",    email: "dakotalee@seed.mixreflect.com"    },
];

const REVIEWS = [
  // Decent — ALMOST_THERE
  {
    firstImpression: "DECENT" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 3,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "LET_PLAY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "beat hits the way it should for this style and the delivery fits the vibe. you can feel what the track is going for and it mostly lands.",
    biggestWeaknessSpecific: "main thing for me is the track doesnt really evolve much. it stays at a pretty similar energy the whole way through and I start loosing interest before it ends. even one moment where something shifts or drops would give it way more shape and keep you locked in til the end.",
  },
  // Good — RELEASE_READY
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
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
    nextFocus: "MIXING" as const,
    bestPart: "flow is locked in on this and the production slaps. caught me from the start and held it, the beat drop hits different. solid track.",
    biggestWeaknessSpecific: "only real note is somthing in the mix feels a touch congested when everything is going at full speed. a bit more seperation between elements especially in the mids would clean it up and give it more punch. its pretty close to ready as is tho.",
  },
];

async function ensureSeeds() {
  const result: { id: string; email: string }[] = [];
  for (const s of SEED_POOL) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
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
        artistName: s.name,
        completedOnboarding: true,
        reviewCredits: 0,
        reviewerExpertise: "INTERMEDIATE",
        experienceLevel: "INTERMEDIATE",
      },
    });
    result.push({ id: profile.id, email: s.email });
  }
  return result;
}

async function main() {
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { reviewsCompleted: true, reviewsRequested: true },
  });
  if (!track) throw new Error("Track not found");
  console.log(`Track: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  const usedIds = (
    await prisma.review.findMany({
      where: { trackId: TRACK_ID },
      select: { peerReviewerArtistId: true },
    })
  ).map(r => r.peerReviewerArtistId).filter(Boolean) as string[];
  const usedSet = new Set(usedIds);

  const allSeeds = await ensureSeeds();
  const available = allSeeds.filter(s => !usedSet.has(s.id));

  if (available.length < REVIEWS.length) {
    throw new Error(`Not enough unused seeds (need ${REVIEWS.length}, found ${available.length})`);
  }

  let completed = track.reviewsCompleted;

  for (let i = 0; i < REVIEWS.length; i++) {
    const seed = available[i];
    const review = REVIEWS[i];
    completed += 1;

    const isNowComplete = completed >= track.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({
        where: { trackId: TRACK_ID, artistReviewerId: seed.id },
      });

      await tx.review.create({
        data: {
          trackId: TRACK_ID,
          peerReviewerArtistId: seed.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId,
          listenDuration,
          firstImpression: review.firstImpression,
          productionScore: review.productionScore,
          vocalScore: review.vocalScore,
          originalityScore: review.originalityScore,
          wouldListenAgain: review.wouldListenAgain,
          qualityLevel: review.qualityLevel,
          vocalClarity: review.vocalClarity,
          lowEndClarity: review.lowEndClarity,
          highEndQuality: review.highEndQuality,
          stereoWidth: review.stereoWidth,
          dynamics: review.dynamics,
          trackLength: review.trackLength,
          tooRepetitive: review.tooRepetitive,
          playlistAction: review.playlistAction,
          nextFocus: review.nextFocus,
          bestPart: review.bestPart,
          biggestWeaknessSpecific: review.biggestWeaknessSpecific,
          weakestPart: review.biggestWeaknessSpecific,
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

    console.log(`[OK] Review ${i + 1} (${review.qualityLevel}) — ${seed.email} → ${completed}/${track.reviewsRequested}`);

    if (isNowComplete) {
      try {
        await sendReviewProgressEmail(ARTIST_EMAIL, TRACK_TITLE, completed, track.reviewsRequested);
        console.log(`[EMAIL] Completion email → ${ARTIST_EMAIL}`);
      } catch (e) {
        console.error("[EMAIL ERR] Completion email failed:", e);
      }
    }
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
