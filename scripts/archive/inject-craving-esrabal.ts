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

const SEED_SKIP = 4; // melodic-trio: 0-2, låt-1234: 3

// Track: "Wdl7LkGIEII26TSe7V" (Craving by esrabal) — cmm7ccv4j000104jxn99599yc
// SoundCloud, guitar + voice, interesting chord choices, solid voice, well mixed
// A bit predictable in structure — mix up 3 distinct reviewer personalities
// 0/3 reviews — full inject to COMPLETED

const TRACK_ID = "cmm7ccv4j000104jxn99599yc";

const reviews = [
  {
    // Reviewer 1 — uses "..." a lot, scattered energy, weird spelling, genuine enthusiasm but notes predictability
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
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
    wouldListenAgain: true,
    bestPart:
      "Honestly this caught me off guard... the chord choices are really intresting and that voice is noticeabley strong from the very first line. Also the mix sounds cleaner than most stuff I come across... everything sits really nicely.",
    biggestWeaknessSpecific:
      "It does get a bit predictable after a while tho... the structure kind of does exactly what you expect and I think with chord choices this good there is definite room to take the arrangment somwhere more suprising. Like when it resolved at the end I could already see it coming. Would love to hear them take a risk somewhere in the middle.",
  },
  {
    // Reviewer 2 — uses !!, enthusiastic and brief, positive but pushes for more
    firstImpression: "STRONG_HOOK" as const,
    originalityScore: 5,
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
      "That voice!! Really solid and the guitar playing throughout is warm and confident. The chord progressions are genuinely nice - not the boring stuff you hear everywhere!! You can tell this person has really developed their own sound.",
    biggestWeaknessSpecific:
      "The main thing I would work on is the song structure playing it a bit safe. Given how interesting the chord work is I would love to hear it take an unexpected turn somewhere - maybe a key change or a section that does something completely different. I think that could take this from a good track to a really memorable one.",
  },
  {
    // Reviewer 3 — measured, thoughtful, longer sentences, no punctuation extremes
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
      "What stands out most is the combination of an interesting harmonic palette and a genuinely good vocal. Those two things are hard to find together and this track has both. The mix is clean and everything sits well which makes it easy to focus on the songwriting.",
    biggestWeaknessSpecific:
      "My main feedback is around the overall arc of the song. It does its thing well but the dynamic curve stays fairly flat from start to finish - the same emotional intensity pretty much throughout. I think introducing a moment where the song drops right back and then rebuilds would add a lot to the experience and give the vocal and the guitar somewhere more interesting to go.",
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
    take: 3,
  });
  if (seedProfiles.length < 3)
    throw new Error(`Not enough seed reviewers (got ${seedProfiles.length}, need 3)`);
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

      console.log(`  [OK] Review ${i + 1}/3 created (${seeder.User?.email})`);
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
