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

const ARTIST_EMAIL = "ppepon788@gmail.com";
const SEED_SKIP = 0;

// Track: "They're Groovin!" — lo-fi/distorted guitar groove
// Cool drum intro (almost Oasis-ish), unique distorted guitar throughout.
// Mixing is rough but suits the lo-fi aesthetic. No vocals mentioned → NOT_APPLICABLE.
// Only 2 reviews requested.

const reviews = [
  {
    // Reviewer 1 — music nerd, catches the energy of the drum intro, loves the unique vibe, accepts the lo-fi mix
    firstImpression: "STRONG_HOOK" as const,
    originalityScore: 5,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
    vocalClarity: "NOT_APPLICABLE" as const,
    vocalScore: null,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "that drum intro is sick, reminded me of something big straight away. And then the distorted guitar kicking in over it just works. Super fun and unique, not heard anything quite like it.",
    biggestWeaknessSpecific:
      "The mix is a bit rough around the edges but honestly it kinda suits the whole lo-fi distorted thing going on. If I had to push for somthing to improve I'd say cleaning it up slightly could help it translate better on different speakers without losing the vibe it has",
  },
  {
    // Reviewer 2 — straightforward, loves the groove, flags the muddy mix and harsh distortion more directly
    firstImpression: "DECENT" as const,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
    vocalClarity: "NOT_APPLICABLE" as const,
    vocalScore: null,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "TOO_HARSH" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "really cool and fun energy to this. the distorted guitar sound is genuinely interesting and the groove of the whole thing keeps you listening.",
    biggestWeaknessSpecific:
      "mix could definitely use some work - it feels a bit muddy and the distortion gets quite harsh at times. I get that the rough sound is part of the aesthetic and it does suit the track but I think you could tighten it up without losing that character",
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
      title: { contains: "Groovin", mode: "insensitive" },
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

  // 4. Inject reviews + complete track in one transaction
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const seeder = seedProfiles[i];

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

    await tx.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: 2,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`  [OK] Track marked COMPLETED (2/2)`);
  });

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
