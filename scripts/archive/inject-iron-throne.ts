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

const ARTIST_EMAIL = "turnertn931@gmail.com";
const SEED_SKIP = 15;

// Track: "iron throne" by bullyturner — trap beat, instrumental
// Heavy distortion + over-compression, works well. 808 sounds thick.
// Interesting melody. Hi-hats at 0:55 are crisp.
// Needs more movement / dynamic variation throughout.
// Status IN_PROGRESS, 2/3 — adding 1 more.

const review = {
  // trap head, loves the heavy sound and thick 808, wants more arrangement movement
  firstImpression: "STRONG_HOOK" as const,
  originalityScore: 5,
  qualityLevel: "ALMOST_THERE" as const,
  productionScore: 3,
  vocalClarity: "NOT_APPLICABLE" as const,
  vocalScore: null,
  lowEndClarity: "PERFECT" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "ACCEPTABLE" as const,
  tooRepetitive: true,
  trackLength: "PERFECT" as const,
  wouldListenAgain: true,
  bestPart:
    "the 808 on this is fat as hell. Sounds really thick and the melody over the top is interesting. Those hi-hats around 0:55 are super crisp too.",
  biggestWeaknessSpecific:
    "it could do with a bit more movement throughout. the distortion and compression work for the vibe but it sits at a similar intensity the whole way through. more variation in the breaks woud make it feel a lot more dynamic and hit harder overall",
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

  // Find the IN_PROGRESS track (title is an internal ID so match by status + artist)
  const tracks = await prisma.track.findMany({
    where: {
      artistId: artistProfile.id,
      status: "IN_PROGRESS",
    },
    select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true, status: true, sourceUrl: true },
  });

  if (tracks.length === 0) throw new Error(`No IN_PROGRESS track found for ${ARTIST_EMAIL}`);
  if (tracks.length > 1) {
    console.log("[WARN] Multiple IN_PROGRESS tracks found:");
    tracks.forEach((t) => console.log(`  - "${t.title}" (${t.id}) ${t.reviewsCompleted}/${t.reviewsRequested}`));
    throw new Error("Narrow down the track manually");
  }

  const track = tracks[0];
  console.log(
    `[INFO] Found track: "${track.title}" (${track.id}) — ${track.reviewsCompleted}/${track.reviewsRequested}`
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
