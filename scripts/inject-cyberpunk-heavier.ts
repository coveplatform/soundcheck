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

const ARTIST_EMAIL = "afiguera@gmail.com";
const SEED_SKIP = 43;

// Track: "Cyberpunk 2077, but HEAVIER" — instrumental metal
// Insane groove, interesting guitar, well mixed.
// Main feedback: needs more arrangement variability, energy contrast — drop lower so
// heavy parts hit harder on the return. Currently stays at similar intensity throughout.

const reviews = [
  {
    // Reviewer 1 — metal fan, enthusiastic, groove lover, wants more contrast
    firstImpression: "STRONG_HOOK" as const,
    originalityScore: 5,
    qualityLevel: "RELEASE_READY" as const,
    productionScore: 4,
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
      "The groove on this is seriously sick. That guitar tone cuts through perfectly and the whole thing just hits. Really solid mix too, everything sits where it should.",
    biggestWeaknessSpecific:
      "I feel like the track could use a bit more contrast in the arrangement. Like it keeps hitting at the same level most of the way through which is great but if there were some sections where the energy dropped right down it would make the heavy parts feel even more massive when they come back",
  },
  {
    // Reviewer 2 — analytical, composition-focused, mentions dynamic curve
    firstImpression: "DECENT" as const,
    originalityScore: 3,
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
      "the guitar work is genuinely interesting and the mix is clean. The groove carries it really well from the start.",
    biggestWeaknessSpecific:
      "the composition feels a bit samey after a while. there are moments where it feels like the track needs to breathe a little more - drop the energy right back and then let it build again. right now it stays at a similar intensity and I think having more of a dynamic curve wuold make those heavy moments land so much harder",
  },
  {
    // Reviewer 3 — casual but hyped, loves the vibe, wants bigger payoff on the drop back
    firstImpression: "STRONG_HOOK" as const,
    originalityScore: 5,
    qualityLevel: "RELEASE_READY" as const,
    productionScore: 4,
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
      "this slaps honestly. that groove is insane and the guitar is super cool, sounds heavy as hell but also really clean. Love it.",
    biggestWeaknessSpecific:
      "I think the only thing I'd want is for some parts to pull back more before the heavy bits. Like when it hits hard, it would feel way more impactful if there was a moment where everthing sort of strips back first. As it is the energy is kinda constant which is still cool but you could make it feel even more massive",
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
      title: { contains: "Cyberpunk", mode: "insensitive" },
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

  // 4. Inject reviews + complete track in one transaction
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
