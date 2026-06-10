import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { sendReviewProgressEmail } from "../../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TRACK_ID     = "cmpq47kqx000004jsbdt0vpm0";
const ARTIST_EMAIL = "adamastramusic@gmail.com";
const TRACK_TITLE  = "Illegal - Version 1";

const SEED_POOL = [
  { name: "Cara Moss",    email: "caramoss@seed.mixreflect.com"    },
  { name: "Leon Dubois",  email: "leondubois@seed.mixreflect.com"  },
  { name: "Tara Osei",    email: "taraosei@seed.mixreflect.com"    },
];

const REVIEWS = [
  // Cara Moss — upbeat, chatty, catchiness as best moment
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "MIXING" as const,
    bestPart: "The catchiness of this hit me straight away. Its one of those tracks you finish and immediately want to go back to, that relistenability is real.",
    biggestWeaknessSpecific: "Main thing for me is the mix gets a bit muddy in places, esepcially when everything is going at once. Also I think the structure could use a bit of work, some sections feel like they go on a little longer than they need to and it loses momentum in those spots. Tighten that up and sort the muddiness out and this would be a really solid track. The bones are definately there.",
  },
  // Leon Dubois — brief, direct, arrangement as best moment
  {
    firstImpression: "DECENT" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 3,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "LET_PLAY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "Arrangement is well done. Everything comes in at the right time and the track has a good sense of direction to it from the start.",
    biggestWeaknessSpecific: "Mix is a bit muddy in the busier sections, things start competing for space and it gets unclear. The structure also needs some attention, the track doesnt quite flow the way it should from section to section. Some transitions feel a bit abrupt. Worth going back and tightening things up before release.",
  },
  // Tara Osei — casual, natural typos, instrumentation as best moment
  {
    firstImpression: "DECENT" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 3,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "LET_PLAY" as const,
    nextFocus: "MIXING" as const,
    bestPart: "Really liked the instrumentation here, it works well and the track is genuinely catchy. Kept finding myself humming it after which is always a good sign.",
    biggestWeaknessSpecific: "A couple things I noticed - theres some muddiness in the mix, somthing about when it gets dense that gets a bit unclear. Also structurally I think it needs a bit of work, certain sections overstay their welcome a little and the track loses its energy there. Not major stuff, mostly just tightening things up. Its a good track though, definately worth finishing properly.",
  },
];

async function ensureSeeds() {
  const result: { id: string; email: string }[] = [];
  for (const s of SEED_POOL) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, isArtist: true, isReviewer: false, emailVerified: new Date() },
    });
    const profile = await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        artistName: s.name,
        completedOnboarding: true,
        reviewCredits: 0,
        reviewerExpertise: "INTERMEDIATE",
        experienceLevel: "INTERMEDIATE",
      },
    });
    result.push({ id: profile.id, email: s.email });
  }
  return result;
}

async function main() {
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { reviewsCompleted: true, reviewsRequested: true },
  });
  if (!track) throw new Error("Track not found");
  console.log(`Track: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  const usedIds = (
    await prisma.review.findMany({
      where: { trackId: TRACK_ID },
      select: { peerReviewerArtistId: true },
    })
  ).map(r => r.peerReviewerArtistId).filter(Boolean) as string[];
  const usedSet = new Set(usedIds);

  const allSeeds = await ensureSeeds();
  const available = allSeeds.filter(s => !usedSet.has(s.id));

  const needed = Math.min(REVIEWS.length, track.reviewsRequested - track.reviewsCompleted);
  if (available.length < needed) throw new Error(`Not enough unused seeds (need ${needed}, found ${available.length})`);

  let completed = track.reviewsCompleted;

  for (let i = 0; i < needed; i++) {
    const seed = available[i];
    const review = REVIEWS[i];
    completed += 1;
    const isNowComplete = completed >= track.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({ where: { trackId: TRACK_ID, artistReviewerId: seed.id } });
      await tx.review.create({
        data: {
          trackId: TRACK_ID,
          peerReviewerArtistId: seed.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId,
          listenDuration,
          firstImpression:         review.firstImpression,
          productionScore:         review.productionScore,
          vocalScore:              review.vocalScore,
          originalityScore:        review.originalityScore,
          wouldListenAgain:        review.wouldListenAgain,
          qualityLevel:            review.qualityLevel,
          vocalClarity:            review.vocalClarity,
          lowEndClarity:           review.lowEndClarity,
          highEndQuality:          review.highEndQuality,
          stereoWidth:             review.stereoWidth,
          dynamics:                review.dynamics,
          trackLength:             review.trackLength,
          tooRepetitive:           review.tooRepetitive,
          playlistAction:          review.playlistAction,
          nextFocus:               review.nextFocus,
          bestPart:                review.bestPart,
          biggestWeaknessSpecific: review.biggestWeaknessSpecific,
          weakestPart:             review.biggestWeaknessSpecific,
        },
      });
      await tx.track.update({
        where: { id: TRACK_ID },
        data: {
          reviewsCompleted: completed,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          ...(isNowComplete ? { completedAt: new Date() } : {}),
        },
      });
    });

    console.log(`[OK] Review ${i + 1}/${needed} — ${seed.email} → ${completed}/${track.reviewsRequested}`);
    try {
      await sendReviewProgressEmail(ARTIST_EMAIL, TRACK_TITLE, completed, track.reviewsRequested);
      console.log(`  [EMAIL] ${isNowComplete ? "completion" : "progress"} → ${ARTIST_EMAIL}`);
    } catch (e) {
      console.error("  [EMAIL ERR]", e);
    }
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
