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

const SEED_SKIP = 3; // melodic-trio uses 0-2 (one seed per track)

// Track: "låt 1234" — electronic, instrumental
// Not bad overall, bit predictable, muddy mids, drops need more emphasis / fills
// 0/1 reviews — single review to complete

const TRACK_ID = "cmm5dygo5000004l7rzvihedj";

const review = {
  // Personality: matter-of-fact, no fluff, uses "tbh", direct
  firstImpression: "DECENT" as const,
  originalityScore: 3,
  qualityLevel: "ALMOST_THERE" as const,
  productionScore: 3,
  vocalClarity: "NOT_APPLICABLE" as const,
  vocalScore: null,
  lowEndClarity: "BOTH_MUDDY" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  tooRepetitive: true,
  trackLength: "PERFECT" as const,
  wouldListenAgain: true,
  bestPart:
    "The energy is there and the overall direction of the track is solid. You can tell there's a clear vision for what it's trying to be and for the most part it delivers on that. The sound design has some nice moments in it too.",
  biggestWeaknessSpecific:
    "Tbh the main things holding it back are the mids feeling a bit muddy and the drops not hitting as hard as they should. The drops need more build up and fills to really land properly - right now they kind of just arrive without enough anticipation. Also the structure is fairly predictable and doesnt do much to surprise the listener. Cleaning up the low mids and adding more movement around the drops would make a noticeable difference.",
};

async function main() {
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
  });
  if (!track) throw new Error(`Track not found: ${TRACK_ID}`);
  console.log(`[INFO] Track: "${track.title}" — ${track.reviewsCompleted}/${track.reviewsRequested}`);

  const [seeder] = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 1,
  });
  if (!seeder) throw new Error("No seed reviewer found");
  console.log(`[INFO] Seed reviewer: ${seeder.User?.email}`);

  await prisma.$transaction(async (tx) => {
    await tx.reviewQueue.deleteMany({
      where: { trackId: TRACK_ID, artistReviewerId: seeder.id },
    });

    await tx.review.create({
      data: {
        trackId: TRACK_ID,
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
      where: { id: TRACK_ID },
      data: {
        reviewsCompleted: track.reviewsRequested,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`  [OK] Review created + track marked COMPLETED`);
  });

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
