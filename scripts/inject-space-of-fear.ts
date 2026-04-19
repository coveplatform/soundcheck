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

const ARTIST_EMAIL = "the7thparadox.band@gmail.com";
const SEED_SKIP = 5;

// Track: "Space of Fear" — alt indie / emo
// Sick guitar tone, very raw and suits the vibe.
// Vocals are cool but sitting too low in the mix — don't cut through enough.
// Only 1 review requested.

const review = {
  // alt/emo fan, loves the raw guitar, tells them to push vocals up
  firstImpression: "STRONG_HOOK" as const,
  originalityScore: 5,
  qualityLevel: "ALMOST_THERE" as const,
  productionScore: 3,
  vocalClarity: "SLIGHTLY_BURIED" as const,
  vocalScore: 2,
  lowEndClarity: "PERFECT" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  tooRepetitive: false,
  trackLength: "PERFECT" as const,
  wouldListenAgain: true,
  bestPart:
    "that guitar tone is just raw and perfect for this kind of sound. Really suits the vibe and has a lot of character to it.",
  biggestWeaknessSpecific:
    "The vocals are actually really cool but they get a bit lost in the mix. I think just pushing them up a bit would make a massive difference, they dont cut through as much as they should and its a shame because the performance is genuinely good",
};

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
      title: { contains: "Space of Fear", mode: "insensitive" },
    },
    select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true, status: true },
  });
  if (!track) throw new Error(`Track not found for ${ARTIST_EMAIL}`);
  console.log(
    `[INFO] Found track: "${track.title}" (${track.id}) — status: ${track.status}, ${track.reviewsCompleted}/${track.reviewsRequested}`
  );

  // 3. Get 1 seed reviewer
  const seedProfiles = await prisma.artistProfile.findMany({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
    },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 1,
  });
  if (seedProfiles.length < 1)
    throw new Error(`No seed reviewer found`);
  const seeder = seedProfiles[0];
  console.log(`[INFO] Using seed reviewer: ${seeder.User?.email}`);

  // 4. Inject review + complete track in one transaction
  await prisma.$transaction(async (tx) => {
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

    console.log(`  [OK] Review created (${seeder.User?.email})`);

    await tx.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: 1,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`  [OK] Track marked COMPLETED (1/1)`);
  });

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
