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

const ARTIST_EMAIL = "jesusgirlarchive@gmail.com";
const SEED_SKIP = 40;

// Track: "good deal - jesus girl" — downtempo/hyperpop-ish, female vocals
// Piano + synths + guitar (reverb/delay). Mix is a bit muddy, bass rings slightly.
// Breakdown at 1:07 with synth melody — percussion could be fuller on return.

const reviews = [
  {
    // Reviewer 1 — casual, direct, gets straight to the bass/mud issue
    firstImpression: "DECENT" as const,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
    vocalClarity: "BURIED" as const,
    vocalScore: 2,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "The whole vibe is just cool. Piano with the synths is such a good combo and it really suits her voice perfectly.",
    biggestWeaknessSpecific:
      "The bass is ringing a bit and it makes everything feel kinda muddy. Her vocals get a bit lost in all that low end. I think turning them up and cleaning up the bass would make a big difference overall.",
  },
  {
    // Reviewer 2 — chatty, positive first impression, picks up on the 1:07 breakdown
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
      "honestly the guitar with all that reverb on it sounds so good. and the piano is realy elegant. her voice suits this perfectly, she sounds great.",
    biggestWeaknessSpecific:
      "I think the breakdown at 1:07 is nice but when everything comes back after it, it doesnt quite hit as hard as it could. think if the percussion came in fuller it woud make that moment a lot more satisfying when she starts singing again",
  },
  {
    // Reviewer 3 — brief and blunt, focuses on the muddy mix and slightly buried vocals
    firstImpression: "DECENT" as const,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
    vocalClarity: "SLIGHTLY_BURIED" as const,
    vocalScore: 2,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "the synths and piano together are beautiful. realy sets a mood straight away and her voice sounds lovely over it",
    biggestWeaknessSpecific:
      "mix needs a bit of work i think. feels a little muddy especially in the low end, and her vocals are slightly burried which is a shame because shes got a good voice. cleaning that up would go a long way",
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
      title: { contains: "good deal", mode: "insensitive" },
    },
    select: { id: true, title: true, reviewsRequested: true, status: true },
  });
  if (!track) throw new Error(`Track not found for ${ARTIST_EMAIL}`);
  console.log(
    `[INFO] Found track: "${track.title}" (${track.id}) — status: ${track.status}, requested: ${track.reviewsRequested}`
  );

  // 3. Get seed reviewers
  const seedProfiles = await prisma.artistProfile.findMany({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
    },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 3,
  });
  if (seedProfiles.length < 3)
    throw new Error(
      `Not enough seed reviewers (got ${seedProfiles.length}, need 3)`
    );
  console.log(
    `[INFO] Using seed reviewers: ${seedProfiles.map((s) => s.User?.email).join(", ")}`
  );

  // 4. Inject reviews + update track in one transaction
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

      console.log(`  [OK] Review ${i + 1}/3 created (${seeder.User?.email})`);
    }

    // Mark track complete
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
