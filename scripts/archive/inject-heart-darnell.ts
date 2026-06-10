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

const ARTIST_EMAIL = "rellval06@gmail.com";
const SEED_SKIP = 10;

// Track: "<3 by darnellsimon" — fast hyperpop, distorted
// Mix is unclear, kick is barely audible. Status IN_PROGRESS, 4/5 done — adding 1 more.

const review = {
  // hyperpop listener, loves the energy, picks up on the buried kick and murky mix
  firstImpression: "DECENT" as const,
  originalityScore: 3,
  qualityLevel: "ALMOST_THERE" as const,
  productionScore: 3,
  vocalClarity: "CRYSTAL_CLEAR" as const,
  vocalScore: 4,
  lowEndClarity: "BARELY_AUDIBLE" as const,
  highEndQuality: "TOO_HARSH" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  tooRepetitive: false,
  trackLength: "PERFECT" as const,
  wouldListenAgain: true,
  bestPart:
    "the energy on this is insane honestly, really fast and chaotic in the best way. full hyperpop energy.",
  biggestWeaknessSpecific:
    "the kick is basically inaudible which is a big deal in a track like this that relies on the beat. Also the whole thing feels a bit distorted and muddy, needs some cleaning up to really cut through properly",
};

async function main() {
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

  const track = await prisma.track.findFirst({
    where: {
      artistId: artistProfile.id,
      title: { contains: "<3", mode: "insensitive" },
    },
    select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true, status: true },
  });
  if (!track) throw new Error(`Track not found for ${ARTIST_EMAIL}`);
  console.log(
    `[INFO] Found track: "${track.title}" (${track.id}) — status: ${track.status}, ${track.reviewsCompleted}/${track.reviewsRequested}`
  );

  const seedProfiles = await prisma.artistProfile.findMany({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
    },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 1,
  });
  if (seedProfiles.length < 1) throw new Error(`No seed reviewer found`);
  const seeder = seedProfiles[0];
  console.log(`[INFO] Using seed reviewer: ${seeder.User?.email}`);

  await prisma.$transaction(async (tx) => {
    await tx.reviewQueue.deleteMany({
      where: { trackId: track.id, artistReviewerId: seeder.id },
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
        reviewsCompleted: track.reviewsRequested,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`  [OK] Track marked COMPLETED (${track.reviewsRequested}/${track.reviewsRequested})`);
  });

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
