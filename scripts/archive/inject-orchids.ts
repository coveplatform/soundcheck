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

const TRACK_ID    = "cmpg3xhxb000004kystznkplx";
const ARTIST_EMAIL = "oliverlardner@gmail.com";
const TRACK_TITLE  = "Orchids";

const SEED_POOL = [
  { name: "Sam Winters", email: "samwinters@seed.mixreflect.com" },
  { name: "Jess Okafor", email: "jessokafor@seed.mixreflect.com" },
];

const REVIEWS = [
  // Sam Winters — warm, chatty, dynamic curve plateaus, muddy low end
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
    bestPart: "The atmosphere on this is genuinely beautiful. There's this warmth in the low end that wraps around you from the first few seconds and it stays that way throughout.",
    biggestWeaknessSpecific: "For me the main thing is the mid section just kind of loses its momentum a bit. It builds up really nicely in the opening but then it settles and dosnt quite push forward again the way I expected. I think the dynamic curve flattens out too early. The resolution at the end feels a bit muted given how much the track built up before it. Also the low end in the denser moments gets slightly muddy, a little tighter there and the whole thing would sit better.",
  },
  // Jess Okafor — brief, direct, stereo too narrow, lacks dynamic contrast
  {
    firstImpression: "DECENT" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 3,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "TOO_NARROW" as const,
    dynamics: "ACCEPTABLE" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "LET_PLAY" as const,
    nextFocus: "MIXING" as const,
    bestPart: "First impression was solid from the start. The sonic texture is really interesting and the mix has an openness to it that I genuinely liked on first listen.",
    biggestWeaknessSpecific: "Main thing for me is the stereo image feels a bit narrow throughout. In the sections where the track wants to open up and breathe you dont quite get that sense of space. Widening the mix even slightly would let a lot more detail come through and give it a more expansive feel. Also I think there could be more contrast between the quieter and louder moments. Right now it runs at a pretty even level which makes it harder to feel the peaks.",
  },
];

async function ensureSeeds() {
  const result: { id: string; email: string }[] = [];
  for (const s of SEED_POOL) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        isArtist: true,
        isReviewer: false,
        emailVerified: new Date(),
      },
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
          firstImpression: review.firstImpression,
          productionScore: review.productionScore,
          vocalScore: review.vocalScore,
          originalityScore: review.originalityScore,
          wouldListenAgain: review.wouldListenAgain,
          qualityLevel: review.qualityLevel,
          vocalClarity: review.vocalClarity,
          lowEndClarity: review.lowEndClarity,
          highEndQuality: review.highEndQuality,
          stereoWidth: review.stereoWidth,
          dynamics: review.dynamics,
          trackLength: review.trackLength,
          tooRepetitive: review.tooRepetitive,
          playlistAction: review.playlistAction,
          nextFocus: review.nextFocus,
          bestPart: review.bestPart,
          biggestWeaknessSpecific: review.biggestWeaknessSpecific,
          weakestPart: review.biggestWeaknessSpecific,
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
