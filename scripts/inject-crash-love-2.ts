import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TRACK_ID = "cmp5twadc000004jrox1i0xs5";

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
];

const REVIEWS = [
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
    trackLength: "TOO_SHORT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "ok fuck this is actually really good. the sound design choices throughout are genuinely impressive, the way everthing layers and builds feels super intentional. love it.",
    biggestWeaknessSpecific: "honestly my only complaint is that its too short lol. felt like it was just getting going and then it ended. wouldve loved another section or even just a longer outro to let it breathe more. give me more of this.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "PROFESSIONAL" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "READY_TO_RELEASE" as const,
    bestPart: "this is genuinely an unreal pop song. everything about it just works, the production is clean and it hits the way it should. been a while since somthing caught me like this.",
    biggestWeaknessSpecific: "honestly theres not much for me to say here. maybe very slightly more polish on the mix but even that feels like im reaching. youve got a really good thing going dont overthink it.",
  },
];

async function main() {
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { reviewsCompleted: true, reviewsRequested: true },
  });
  if (!track) throw new Error("Track not found");
  console.log(`Track: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  // Find seeds not already used for this track
  const usedIds = (await prisma.review.findMany({
    where: { trackId: TRACK_ID },
    select: { peerReviewerArtistId: true },
  })).map(r => r.peerReviewerArtistId).filter(Boolean) as string[];
  const usedSet = new Set(usedIds);

  // Resolve seed profile IDs
  const available: { id: string; email: string }[] = [];
  for (const s of SEED_POOL) {
    if (available.length >= REVIEWS.length) break;
    const user = await prisma.user.findUnique({ where: { email: s.email }, select: { id: true } });
    if (!user) continue;
    const profile = await prisma.artistProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!profile || usedSet.has(profile.id)) continue;
    available.push({ id: profile.id, email: s.email });
  }

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
    const listenDuration = 120 + Math.floor(Math.random() * 240);

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

    console.log(`[OK] Review ${i + 1} — ${seed.email} → ${completed}/${track.reviewsRequested}`);
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
