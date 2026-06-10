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

const ARTIST_EMAIL = "concordiabandofficial@gmail.com";
const SEED_SKIP = 20;

// Track: "Concordia - Deliver Us by Concordia" — hard rock, 80s sound
// Vocalist has serious pipes. Mixed well. Guitar break at 1:08 is sick.
// Chorus is catchy. Song structure a little too formulaic.
// 0/3 — full inject.

const reviews = [
  {
    // Reviewer 1 — classic rock fan, blown away by the vocalist, specifically calls out 1:08 guitar break
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
    tooRepetitive: true,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "That vocalist is absolutely incredible, seriously powerful voice. And the guitar break at 1:08 is just perfect - it had me rewinding it straight away.",
    biggestWeaknessSpecific:
      "The song structure is a little predictable if im honest. You can kind of feel where it's going before it gets there - verse chorus verse chorus bridge chorus. It's done well but I think if they took a few risks with the arrangement it could really elevate it to another level",
  },
  {
    // Reviewer 2 — music lover, 80s vibes are their thing, chorus is the standout, frames structure as "by-the-book"
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
    tooRepetitive: true,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "this sounds genuinely incredible. That 80s rock sound is right in my wheelhouse and the chorus is so catchy. Also the mix is really clean and polished for this kind of sound.",
    biggestWeaknessSpecific:
      "only thing holding it back slightly is the structure feels quite by-the-book. it hits all the exepected moments which is fine but for a band this talented I think theres room to do somthing a bit more unexpected with the arrangement and really make it stand out",
  },
  {
    // Reviewer 3 — more measured, analytical, DECENT impression, still very positive but sees the formula clearly
    firstImpression: "DECENT" as const,
    originalityScore: 3,
    qualityLevel: "RELEASE_READY" as const,
    productionScore: 4,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    vocalScore: 4,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: true,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "the vocalist is really impressive and the guitar tone sounds great throughout. Really well produced for this genre, love the way everything sits in the mix.",
    biggestWeaknessSpecific:
      "it follows a pretty standard rock song formula and doesnt deviate much from it. the band is cleary talented enough to push into more interesting territory so id love to hear them take the arrangement somwhere less expected. still a great track though just feels a bit safe",
  },
];

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
      title: { contains: "Deliver Us", mode: "insensitive" },
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
    take: 3,
  });
  if (seedProfiles.length < 3)
    throw new Error(`Not enough seed reviewers (got ${seedProfiles.length}, need 3)`);
  console.log(
    `[INFO] Using seed reviewers: ${seedProfiles.map((s) => s.User?.email).join(", ")}`
  );

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const seeder = seedProfiles[i];

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

      console.log(`  [OK] Review ${i + 1}/3 created (${seeder.User?.email})`);
    }

    await tx.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: 3,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`  [OK] Track marked COMPLETED`);
  });

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
