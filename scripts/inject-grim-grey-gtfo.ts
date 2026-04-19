import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("No DATABASE_URL found");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const ARTIST_EMAIL = "sean.ogilvie@aol.com";
const SEED_SKIP = 46;

// Track: "Grim Grey-GTFO" — hip hop / rap
// Already has 1 review. Adding 2 more to reach 3/3.
// Beat is sick — distorted/amped percussion, works well. Vocals mixed well.
// Main issue: bass lacks low end (cut too low), timbre is distracting and mashes.

const reviews = [
  {
    // Reviewer 1 — hip hop head, loves the crunch, bass timbre bugs them
    firstImpression: "STRONG_HOOK" as const,
    originalityScore: 5,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    vocalScore: 4,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "The beat on this is genuinely hard. That distorted percussion hits different, love the amp/crunch on it. Works so well with the style.",
    biggestWeaknessSpecific:
      "The bass doesn't have enough low end for me. It feels like it's been cut too low and the tone of it gets a bit distracting. Could do with more body to it, right now it sort of mashes into everything rather than sitting underneath it properly.",
  },
  {
    // Reviewer 2 — laid back, casual, picks up on bass being high-passed too aggressively
    firstImpression: "DECENT" as const,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    vocalScore: 4,
    lowEndClarity: "BARELY_AUDIBLE" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "actually really into this. the crunch on the drums is a vibe and the vocals sit nicely on top of it all. solid track overall",
    biggestWeaknessSpecific:
      "the only thing thats off for me is the bass. the timbre of it is a bit weird and distracting and it doesnt have enough low end behind it. feels like its been high-passed too agressively and its pulling focus away from the groove rather than adding to it",
  },
];

async function main() {
  // 1. Find the artist
  const user = await prisma.user.findUnique({
    where: { email: ARTIST_EMAIL },
    select: { id: true },
  });
  if (!user) throw new Error(`User not found: ${ARTIST_EMAIL}`);

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!artistProfile)
    throw new Error(`Artist profile not found for ${ARTIST_EMAIL}`);

  // 2. Find the track
  const track = await prisma.track.findFirst({
    where: {
      artistId: artistProfile.id,
      title: { contains: "Grim Grey", mode: "insensitive" },
    },
    select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true, status: true },
  });
  if (!track) throw new Error(`Track not found for ${ARTIST_EMAIL}`);
  console.log(
    `[INFO] Found track: "${track.title}" (${track.id}) — status: ${track.status}, ${track.reviewsCompleted}/${track.reviewsRequested}`
  );

  // 3. Get seed reviewers (2 this time)
  const seedProfiles = await prisma.artistProfile.findMany({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
    },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 2,
  });
  if (seedProfiles.length < 2)
    throw new Error(
      `Not enough seed reviewers (got ${seedProfiles.length}, need 2)`
    );
  console.log(
    `[INFO] Using seed reviewers: ${seedProfiles.map((s) => s.User?.email).join(", ")}`
  );

  // 4. Inject 2 reviews + complete track in one transaction
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const seeder = seedProfiles[i];

      // Clean up any existing queue entry
      await tx.reviewQueue.deleteMany({
        where: {
          trackId: track.id,
          artistReviewerId: seeder.id,
        },
      });

      await tx.review.create({
        data: {
          trackId: track.id,
          peerReviewerArtistId: seeder.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          firstImpression: r.firstImpression,
          originalityScore: r.originalityScore,
          qualityLevel: r.qualityLevel,
          productionScore: r.productionScore,
          vocalClarity: r.vocalClarity,
          vocalScore: r.vocalScore,
          lowEndClarity: r.lowEndClarity,
          highEndQuality: r.highEndQuality,
          stereoWidth: r.stereoWidth,
          dynamics: r.dynamics,
          tooRepetitive: r.tooRepetitive,
          trackLength: r.trackLength,
          wouldListenAgain: r.wouldListenAgain,
          bestPart: r.bestPart,
          biggestWeaknessSpecific: r.biggestWeaknessSpecific,
          weakestPart: r.biggestWeaknessSpecific,
        },
      });

      console.log(`  [OK] Review ${i + 1}/2 created (${seeder.User?.email})`);
    }

    // reviewsCompleted was 1, adding 2 → 3
    await tx.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: 3,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`  [OK] Track marked COMPLETED (3/3)`);
  });

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
