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

const SEED_SKIP = 8; // melodic-trio:0-2, låt:3, craving:4-6, chaotic:7

// Track: "My Love Radio Édit (Remix Fabrice B) by Disco House Records" — cmmbb5vax000304kyxyf6eywg
// SoundCloud, disco/funk, 1/3 done, needs 2 more to complete
// Nice bassline, really funky and groovy, well mixed, vocals are sick
// Great progression, moment at 1:10 is really groovy, breaks are ok
// A bit predictable in some sections

const TRACK_ID = "cmmbb5vax000304kyxyf6eywg";

const reviews = [
  {
    // Reviewer 1 — disco/funk fan, enthusiastic, references bassline and 1:10 moment specifically, uses !!
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
      "That bassline is absolutely infectious!! The groove locks in straight away and doesnt let go. And the section at 1:10 is just ridiculously funky - that's the moment where it really opens up. Also the vocals sit perfectly in the mix.",
    biggestWeaknessSpecific:
      "Honestly my only note is some sections feel slightly predictable as the track develops - like you can feel certain transitions coming before they hit. The energy and feel are all there but I think a few more suprising moments or unexpected breaks would push it from a great track to an exceptional one.",
  },
  {
    // Reviewer 2 — measured, appreciates the craft, notes the predictable structure
    firstImpression: "DECENT" as const,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    productionScore: 3,
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
      "The production is genuinely well done - the mix is clean and the low end feels solid throughout. The vocals are strong and have a really nice presence in the track. You can tell this was put together carefully.",
    biggestWeaknessSpecific:
      "Where I think it could be stronger is in how it develops. Some of the sections follow a fairly predictable pattern and after a couple of listens you start to anticipate the transitions. I think introducing some less expected moments as it builds would make it a lot more engaging and give the listener more to discover on repeat listens.",
  },
];

async function main() {
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
  });
  if (!track) throw new Error(`Track not found: ${TRACK_ID}`);
  console.log(`[INFO] Track: "${track.title}" — ${track.reviewsCompleted}/${track.reviewsRequested}`);

  const seedProfiles = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, User: { select: { email: true } } },
    skip: SEED_SKIP,
    take: 2,
  });
  if (seedProfiles.length < 2)
    throw new Error(`Not enough seed reviewers (got ${seedProfiles.length}, need 2)`);
  console.log(`[INFO] Seeds: ${seedProfiles.map((s) => s.User?.email).join(", ")}`);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const seeder = seedProfiles[i];

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
      where: { id: TRACK_ID },
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
