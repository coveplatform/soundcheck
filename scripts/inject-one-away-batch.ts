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

// ---------------------------------------------------------------------------
// Track configs
// ---------------------------------------------------------------------------
const TRACKS = [
  {
    id: "cmpg40whm000004l8kv7wvgcu",
    title: "𝔐𝔞𝔡𝔢𝔩𝔢𝔦𝔫𝔢 𝔇𝔯𝔢𝔞𝔪𝔷",
    artistEmail: "oliverlardner@gmail.com",
    seed: { name: "Jamie Park", email: "jamiepark@seed.mixreflect.com" },
    review: {
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: 4,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE" as const,
      vocalClarity: "CRYSTAL_CLEAR" as const,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      trackLength: "PERFECT" as const,
      tooRepetitive: false,
      playlistAction: "LET_PLAY" as const,
      nextFocus: "ARRANGEMENT" as const,
      bestPart: "The opening is really strong honestly, it pulls you in and sets the mood before you even realise it. The whole vibe is well established from the start and I liked that.",
      biggestWeaknessSpecific: "For me the middle section kind of loses some of that momentum from the beginning. It plateaus a bit when I think it could be building toward somthing more. The structure feels like it peaks early and then just stays at the same level for too long. Even a small shift or a stripped back moment in there would help carry you through to the end better. Thats the main thing for me.",
    },
  },
  {
    id: "cmpocr52t000004l2gelifj67",
    title: "Johann Caruana - Dynasty of Fire (Official Music Video)",
    artistEmail: "djjcar@gmail.com",
    seed: { name: "Drew Mitchell", email: "drewmitchell@seed.mixreflect.com" },
    review: {
      firstImpression: "DECENT" as const,
      productionScore: 4,
      vocalScore: 4,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "RELEASE_READY" as const,
      vocalClarity: "CRYSTAL_CLEAR" as const,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      trackLength: "PERFECT" as const,
      tooRepetitive: false,
      playlistAction: "LET_PLAY" as const,
      nextFocus: "ARRANGEMENT" as const,
      bestPart: "The way this builds is genuinely impressive. The arrangement leads you somewhere and the main climax feels fully earned. Really well constructed overall.",
      biggestWeaknessSpecific: "I think the second half drags a little. After the main peak the song settles into a groove but theres no real final push or resolution, it just sort of ends before fully landing. One more moment of tension near the end would make the whole thing feel more complete. The pacing in the back half is the main thing holding it back for me. Everything else is solid though.",
    },
  },
  {
    id: "cmprmqdvb000004jld6rt44bb",
    title: "Around my waist",
    artistEmail: "djsmurphofficial@gmail.com",
    seed: { name: "Cameron Bell", email: "cameronbell@seed.mixreflect.com" },
    review: {
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: 4,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE" as const,
      vocalClarity: "CRYSTAL_CLEAR" as const,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      trackLength: "PERFECT" as const,
      tooRepetitive: false,
      playlistAction: "LET_PLAY" as const,
      nextFocus: "ARRANGEMENT" as const,
      bestPart: "The groove here is genuinely good. Locks in early and the track has a nice sense of movement to it. Also the vocals sit nicely in there and feel natural.",
      biggestWeaknessSpecific: "For me the structure feels a bit flat overall. Nothing changes much from section to section and I kept waiting for a moment that really suprises you. The song stays at pretty much the same energy level start to finish which means it doesnt quite build to anything. A bridge or a breakdown somewhere in the middle could really help lift the final part and give it more payoff. I think thats the main thing to look at.",
    },
  },
  {
    id: "cmppctqla000004lh9tfb3p51",
    title: "Dj Arne L. II - R.I.P",
    artistEmail: "dsa@asdas.com",
    seed: { name: "Riley Evans", email: "rileyevans@seed.mixreflect.com" },
    review: {
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: null,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE" as const,
      vocalClarity: "NOT_APPLICABLE" as const,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      trackLength: "PERFECT" as const,
      tooRepetitive: false,
      playlistAction: "LET_PLAY" as const,
      nextFocus: "ARRANGEMENT" as const,
      bestPart: "The intro does a good job setting the tone and drawing you in from the start. Has a clear identity which I think is important and you nailed that part.",
      biggestWeaknessSpecific: "The main thing I noticed is that the energy doesnt really change much throughout. It builds to a certain point and then just kind of stays there without going anywhere new. I think some structural variation would help a lot. Even a small drop or a transition moment would make the track feel more dynamic. Right now it feels a bit more like a loop than a full journey with a real arc to it.",
    },
  },
  {
    id: "cmppcv71g000304lhsgeuy097",
    title: "Dj Arne L. II - R.I.P",
    artistEmail: "test@test.com",
    seed: { name: "Finley Ross", email: "finleyross@seed.mixreflect.com" },
    review: {
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: null,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE" as const,
      vocalClarity: "NOT_APPLICABLE" as const,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      trackLength: "PERFECT" as const,
      tooRepetitive: false,
      playlistAction: "LET_PLAY" as const,
      nextFocus: "ARRANGEMENT" as const,
      bestPart: "The concept and mood are well established early on. You know exactly what kind of track this is and the vibe stays consistant all the way through which I respect.",
      biggestWeaknessSpecific: "For me theres a point around the middle where the song starts to feel a bit samey. Theres not quite enough variation in the arrangement to keep it feeling fresh the whole way through. Building in a moment of contrast somewhere would help a lot. Could be a stripped back section or a build that hits differently. Just something to break up the pattern and give the listener a new angle before bringing everthing back. Thats the main thing.",
    },
  },
  {
    id: "cmprhb2p2000204jr5crkl8gr",
    title: "Devilish Trio- Labyrinth- Sweed Remix by sweedBeats",
    artistEmail: "p.dzik111@gmail.com",
    seed: { name: "Rowan Scott", email: "rowanscott@seed.mixreflect.com" },
    review: {
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: null,
      originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE" as const,
      vocalClarity: "NOT_APPLICABLE" as const,
      lowEndClarity: "PERFECT" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      trackLength: "PERFECT" as const,
      tooRepetitive: false,
      playlistAction: "LET_PLAY" as const,
      nextFocus: "ARRANGEMENT" as const,
      bestPart: "The energy in this is real good. It flows in a way that keeps you locked in and the vibe is well maintained from start to finish. Good bones on this one.",
      biggestWeaknessSpecific: "My main feedback is about the pacing in the second half. Once the track gets going it doesnt quite know when to breathe. Theres no real moment of release or contrast, it just keeps pushing without giving you a chance to feel the drop as much as you could. A bit of dynamic variation in there would make the big moments hit noticeabley harder. Still a solid remix tho, the structure is nearly there.",
    },
  },
];

// ---------------------------------------------------------------------------

async function ensureSeed(s: { name: string; email: string }) {
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
  return profile.id;
}

async function main() {
  for (const t of TRACKS) {
    console.log(`\n→ ${t.title}`);

    const track = await prisma.track.findUnique({
      where: { id: t.id },
      select: { reviewsCompleted: true, reviewsRequested: true },
    });
    if (!track) { console.log("  SKIP: not found"); continue; }
    if (track.reviewsCompleted >= track.reviewsRequested) {
      console.log("  SKIP: already complete"); continue;
    }

    const seedId = await ensureSeed(t.seed);

    const alreadyReviewed = await prisma.review.findFirst({
      where: { trackId: t.id, peerReviewerArtistId: seedId },
    });
    if (alreadyReviewed) { console.log(`  SKIP: ${t.seed.email} already reviewed this track`); continue; }

    const completed = track.reviewsCompleted + 1;
    const isNowComplete = completed >= track.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);
    const r = t.review;

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({ where: { trackId: t.id, artistReviewerId: seedId } });
      await tx.review.create({
        data: {
          trackId: t.id,
          peerReviewerArtistId: seedId,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId,
          listenDuration,
          firstImpression: r.firstImpression,
          productionScore: r.productionScore,
          vocalScore: r.vocalScore,
          originalityScore: r.originalityScore,
          wouldListenAgain: r.wouldListenAgain,
          qualityLevel: r.qualityLevel,
          vocalClarity: r.vocalClarity,
          lowEndClarity: r.lowEndClarity,
          highEndQuality: r.highEndQuality,
          stereoWidth: r.stereoWidth,
          dynamics: r.dynamics,
          trackLength: r.trackLength,
          tooRepetitive: r.tooRepetitive,
          playlistAction: r.playlistAction,
          nextFocus: r.nextFocus,
          bestPart: r.bestPart,
          biggestWeaknessSpecific: r.biggestWeaknessSpecific,
          weakestPart: r.biggestWeaknessSpecific,
        },
      });
      await tx.track.update({
        where: { id: t.id },
        data: {
          reviewsCompleted: completed,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          ...(isNowComplete ? { completedAt: new Date() } : {}),
        },
      });
    });

    console.log(`  [OK] ${t.seed.email} → ${completed}/${track.reviewsRequested}${isNowComplete ? " ✓ COMPLETE" : ""}`);

    try {
      await sendReviewProgressEmail(t.artistEmail, t.title, completed, track.reviewsRequested);
      console.log(`  [EMAIL] → ${t.artistEmail}`);
    } catch (e) {
      console.error("  [EMAIL ERR]", e);
    }
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
