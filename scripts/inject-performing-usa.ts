import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { sendReviewProgressEmail } from "../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TRACK_ID     = "cmonieux5000304juqks9zw7o";
const ARTIST_EMAIL = "yousign71@gmail.com";
const TRACK_TITLE  = "Performing in the u.s.a";

const SEED_POOL = [
  { name: "Tyler Banks", email: "tylerbanks@seed.mixreflect.com" },
  { name: "Nina Reeves", email: "ninareeves@seed.mixreflect.com" },
  { name: "Dom Carrera", email: "domcarrera@seed.mixreflect.com" },
];

const REVIEWS = [
  // Tyler Banks — energetic, enthusiastic, low end muddy in heavier sections
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "MIXING" as const,
    bestPart: "The energy on this is genuinely hard to ignore. The hook hit me straight away and there's a brightness to the top end of the mix that just lifts the whole thing and makes it feel alive.",
    biggestWeaknessSpecific: "Only thing I'd flag is when everything comes in together in the bigger sections the low end gets a bit congested. It gets slightly muddy compared to how clean it sounds in the sparser parts. Tightening up that bottom end just a touch would give the mix a lot more punch and let the top end breathe properly. Doesnt take away much from the overall vibe but its somthing worth checking on a few different speakers before you release. The energy on this is really something though!",
  },
  // Nina Reeves — measured, uses "...", second half loses energy, dynamics flat
  {
    firstImpression: "DECENT" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 3,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "TOO_COMPRESSED" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "LET_PLAY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "There's a real confidence to this from the start... the mix has a fullness to it that feels properly intentional and the hook lands exactly the way it needs to.",
    biggestWeaknessSpecific: "My main note is around the pacing in the second half... it starts to feel a little flat compared to the opening. The dynamic curve kind of levels off when I think the track wants more peaks and drops. Right now the energy sits at a fairly consistent level throughout which makes the later sections feel less impactful than they could be. A bit more contrast between the quiet and loud moments would push this over the line for me. The foundations are really solid here though, this is close.",
  },
  // Dom Carrera — direct, slightly critical but fair, top end harsh, low end thick
  {
    firstImpression: "DECENT" as const,
    productionScore: 3, vocalScore: 4, originalityScore: 3,
    wouldListenAgain: true,
    qualityLevel: "ALMOST_THERE" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "TOO_HARSH" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "LET_PLAY" as const,
    nextFocus: "MIXING" as const,
    bestPart: "The feeling of this track is genuinely great. There's a real emotional arc to it that carries you through and you can tell this comes from a real place. That counts for a lot.",
    biggestWeaknessSpecific: "Honestly my main thing is the top end feels a bit harsh in places, noticeabley in the more intense moments. On earbuds especially it gets a bit fatiguing after a while. Pulling that back just slightly would make the mix a lot more comfortable to sit with and let the mid range come through more clearly. Also somthing about the low end in the heavier sections feels like its doing a bit too much. It gets thick and loses definition in there. Both things are fixable and this track has real potential.",
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
