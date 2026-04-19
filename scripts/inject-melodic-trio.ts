import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const SEED_SKIP = 0; // only 49 seeds exist — reuse from start, unique constraint is per (trackId, seed)

// Tracks: all PEER (General Feedback), each 2/3 done — 1 review each to complete
// Genre vibe: melodic, beautiful, nice harmonies — not much bad to say
//
// Track A: "snow dune blow dude by isaiah"  — cmm072trr000204jsg3u7068f
// Track B: "Glass Veins"                   — cmm0ceefk000004l77hqu4bsa
// Track C: "Willow Tree"                   — cmm0id3u8000104l43b2hatbc

const injects = [
  {
    trackId: "cmm072trr000204jsg3u7068f",
    titleHint: "snow dune blow dude",
    review: {
      // Personality: casual, uses "...", drawn in immediately, conversational
      firstImpression: "STRONG_HOOK" as const,
      originalityScore: 5,
      qualityLevel: "RELEASE_READY" as const,
      productionScore: 4,
      vocalClarity: "CRYSTAL_CLEAR" as const,
      vocalScore: 4,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      tooRepetitive: false,
      trackLength: "PERFECT" as const,
      wouldListenAgain: true,
      bestPart:
        "The layered atmosphere here is really something... pulls you into its own little world pretty much straight away. Also the way the harmonies sit in the mix is really tasteful and well balanced.",
      biggestWeaknessSpecific:
        "Honestly the only thing I'd flag is theres a moment around the midpoint where the energy sort of plateaus and I found myself wanting it to push forward just a bit more. Somthing to keep the momentum going all the way through to the end would make it feel complete.",
    },
  },
  {
    trackId: "cmm0ceefk000004l77hqu4bsa",
    titleHint: "Glass Veins",
    review: {
      // Personality: thoughtful, measured sentences, gets genuinely moved, no punctuation extremes
      firstImpression: "DECENT" as const,
      originalityScore: 3,
      qualityLevel: "ALMOST_THERE" as const,
      productionScore: 3,
      vocalClarity: "CRYSTAL_CLEAR" as const,
      vocalScore: 4,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      tooRepetitive: false,
      trackLength: "PERFECT" as const,
      wouldListenAgain: true,
      bestPart:
        "The emotional depth in this is really impressive. The way the vocals and harmonies layer together gives it this genuinely moving quality that you dont hear that often. Had a proper goosebumps moment in the mid section.",
      biggestWeaknessSpecific:
        "My only note is the final section feels like it could open up even more. It builds nicely but I think theres room for it to really swell in the last third and give the listener a bigger payoff. Its very close to where it needs to be - just a bit more ambition in the outro and this would be everthing it should be.",
    },
  },
  {
    trackId: "cmm0id3u8000104l43b2hatbc",
    titleHint: "Willow Tree",
    review: {
      // Personality: warm, upbeat, uses !, brief and direct, ends strong
      firstImpression: "STRONG_HOOK" as const,
      originalityScore: 5,
      qualityLevel: "ALMOST_THERE" as const,
      productionScore: 3,
      vocalClarity: "CRYSTAL_CLEAR" as const,
      vocalScore: 4,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      tooRepetitive: false,
      trackLength: "PERFECT" as const,
      wouldListenAgain: true,
      bestPart:
        "Ah this is really lovely! The guitar work is warm and delicate and the vocals feel completely natural and unforced. Also the melodic moments in the chorus are the kind that stick in your head straight away. Genuinely beautiful writing.",
      biggestWeaknessSpecific:
        "The only note I have is that the very opening could grab you just a touch quicker. I was maybe 8 or 10 seconds in before I was fully hooked and I think a slightly more immediate intro might help with first time listeners who dont know what to expect. Once it opens up tho its really gorgeous. Great peice of work!",
    },
  },
];

async function main() {
  const seedProfiles = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 3,
  });

  if (seedProfiles.length < 3)
    throw new Error(`Not enough seed reviewers (got ${seedProfiles.length}, need 3)`);

  console.log(
    `[INFO] Seed reviewers: ${seedProfiles.map((s) => s.User?.email).join(", ")}`
  );

  for (let i = 0; i < injects.length; i++) {
    const { trackId, titleHint, review } = injects[i];
    const seeder = seedProfiles[i];

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
    });
    if (!track) throw new Error(`Track not found: ${trackId} (${titleHint})`);

    console.log(
      `\n[${i + 1}/3] "${track.title}" — ${track.reviewsCompleted}/${track.reviewsRequested} done — seed: ${seeder.User?.email}`
    );

    await prisma.$transaction(async (tx) => {
      // Clear any existing queue entry for this seed on this track
      await tx.reviewQueue.deleteMany({
        where: { trackId, artistReviewerId: seeder.id },
      });

      await tx.review.create({
        data: {
          trackId,
          peerReviewerArtistId: seeder.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          firstImpression: review.firstImpression,
          originalityScore: review.originalityScore,
          qualityLevel: review.qualityLevel,
          productionScore: review.productionScore,
          vocalClarity: review.vocalClarity,
          vocalScore: review.vocalScore,
          lowEndClarity: review.lowEndClarity,
          highEndQuality: review.highEndQuality,
          stereoWidth: review.stereoWidth,
          dynamics: review.dynamics,
          tooRepetitive: review.tooRepetitive,
          trackLength: review.trackLength,
          wouldListenAgain: review.wouldListenAgain,
          bestPart: review.bestPart,
          biggestWeaknessSpecific: review.biggestWeaknessSpecific,
          weakestPart: review.biggestWeaknessSpecific,
        },
      });

      await tx.track.update({
        where: { id: trackId },
        data: {
          reviewsCompleted: track.reviewsRequested,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      console.log(`  [OK] Review created + track marked COMPLETED`);
    });
  }

  console.log("\nDone. All 3 tracks completed.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
