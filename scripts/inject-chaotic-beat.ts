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

const SEED_SKIP = 7; // melodic-trio:0-2, låt:3, craving:4-6

// Track: "Chaotic" — cmmb16yw0000004l22y08ym54
// SoundCloud hip hop beat, 1/2 reviews done, needs 1 more to complete
// Melody is simple/needs more compression to sit with kick, kick distortion is nice
// Break at 0:28 is a bit lackluster — needs perc since kick drops out

const TRACK_ID = "cmmb16yw0000004l22y08ym54";

const review = {
  // Personality: hip hop head, direct, uses "ngl" and "tbh", knows beats
  firstImpression: "DECENT" as const,
  originalityScore: 3,
  qualityLevel: "ALMOST_THERE" as const,
  productionScore: 3,
  vocalClarity: "NOT_APPLICABLE" as const,
  vocalScore: null,
  lowEndClarity: "PERFECT" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  tooRepetitive: true,
  trackLength: "PERFECT" as const,
  wouldListenAgain: true,
  bestPart:
    "That distorted kick is really the standout for me - it hits in a way that feels unique and gives the beat a real identity. The overall energy works and you can tell the direction is intentional.",
  biggestWeaknessSpecific:
    "The main things I'd work on are the melody feeling a bit simple and the break at 0:28 falling a bit flat. Ngl when the kick drops out at that break you need something to fill that space - some percussion or a texture to keep the energy up, because right now it kind of loses momentum there. Also the melodic elements could use more compression to really lock in with the kick and feel tighter overall.",
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
