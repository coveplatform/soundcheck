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

const SEED_POOL = [
  { name: "Marcus Hill",   email: "marcushill@seed.mixreflect.com"   },
  { name: "Priya Nair",    email: "priyanair@seed.mixreflect.com"    },
  { name: "Devon Cross",   email: "devoncross@seed.mixreflect.com"   },
  { name: "Kira Stone",    email: "kirastone@seed.mixreflect.com"    },
  { name: "Elliot Vance",  email: "elliotvance@seed.mixreflect.com"  },
];

type ReviewData = {
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  productionScore: number;
  vocalScore: number | null;
  originalityScore: number;
  wouldListenAgain: boolean;
  qualityLevel: "NOT_READY" | "DEMO_STAGE" | "ALMOST_THERE" | "RELEASE_READY" | "PROFESSIONAL";
  vocalClarity: "CRYSTAL_CLEAR" | "SLIGHTLY_BURIED" | "BURIED" | "TOO_LOUD" | "NOT_APPLICABLE";
  lowEndClarity: "PERFECT" | "KICK_TOO_LOUD" | "BASS_TOO_LOUD" | "BOTH_MUDDY" | "BARELY_AUDIBLE";
  highEndQuality: "PERFECT" | "TOO_DULL" | "TOO_HARSH" | "ACCEPTABLE";
  stereoWidth: "TOO_NARROW" | "GOOD_BALANCE" | "TOO_WIDE";
  dynamics: "GREAT_DYNAMICS" | "ACCEPTABLE" | "TOO_COMPRESSED" | "TOO_QUIET";
  trackLength: "TOO_SHORT" | "PERFECT" | "BIT_LONG" | "WAY_TOO_LONG";
  tooRepetitive: boolean;
  playlistAction: "ADD_TO_LIBRARY" | "LET_PLAY" | "SKIP" | "DISLIKE";
  nextFocus: "MIXING" | "ARRANGEMENT" | "SOUND_DESIGN" | "SONGWRITING" | "PERFORMANCE" | "READY_TO_RELEASE";
  bestPart: string;
  biggestWeaknessSpecific: string;
};

type TrackJob = {
  trackId: string;
  artistEmail: string;
  title: string;
  reviewsRequested: number;
  seedName: string;
  review: ReviewData;
};

const TRACKS: TrackJob[] = [
  // Performing in the u.s.a — 19/20
  {
    trackId: "cmonieux5000304juqks9zw7o",
    artistEmail: "yousign71@gmail.com",
    title: "Performing in the u.s.a",
    reviewsRequested: 20,
    seedName: "Marcus Hill",
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "The opening really pulls you in straight away. There's a confidence to it that sets up the rest of the track well and makes you want to see where it goes. Also the instrumentation is great, everything sits in the right place.",
      biggestWeaknessSpecific: "The main thing for me is the middle section kind of plateaus energy wise. It holds its own but the dynamic arc flattens out a bit when I think it wants to build more. Finding a way to push the energy or contrast it more in that stretch would give the track a much stronger payoff at the end. The bones are solid though, this is close.",
    },
  },

  // i don't remember you — covelaaz@gmail.com — QUEUED 0/1
  {
    trackId: "cmpstjbis000304l8lf1az91b",
    artistEmail: "covelaaz@gmail.com",
    title: "i don't remember you",
    reviewsRequested: 1,
    seedName: "Priya Nair",
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "There's a real atmosphere to this from the start... you can feel the intention behind the arrangement and it draws you in before you even realise it. The instrumentation is really well done too, everything works together.",
      biggestWeaknessSpecific: "The main thing I noticed is the energy settles a bit in the mid section... it doesn't drop off but it kind of plateaus when the track feels like it wants to push somewhere. More dynamic contrast in that stretch would give the whole thing a stronger arc and make the resolution land harder. Still a solid piece of work though, theres real potential here.",
    },
  },

  // Song1 by Alexito_o — alexanderbarraza93@gmail.com — QUEUED 0/1
  {
    trackId: "cmpsjbuxj000304l8802un6tg",
    artistEmail: "alexanderbarraza93@gmail.com",
    title: "Song1 by Alexito_o",
    reviewsRequested: 1,
    seedName: "Devon Cross",
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "Honestly the feel of this is pretty infectious. There's a sense of momentum that keeps you moving through it without losing interest along the way. Instrumentation is a highlight for sure.",
      biggestWeaknessSpecific: "The mid section is where I think theres room to grow. It kind of levels out dynamically when the track wants to keep building. Some more contrast between the quieter and louder moments would make the whole thing feel more exciting and give it a better payoff at the end. But the foundation on this is genuinely good, keep at it.",
    },
  },

  // Spirited Away Remix — kentoraptor@gmail.com — QUEUED 0/1
  {
    trackId: "cmpsgh8xi000304kzdteja4dt",
    artistEmail: "kentoraptor@gmail.com",
    title: "Spirited Away - The Dragon Boy (Remix) by Enzo",
    reviewsRequested: 1,
    seedName: "Kira Stone",
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "The track has this really nice sense of progression to it. It pulls you in from the start and you can feel the craft behind how its put together. The instrumentation choices are great as well, really fits the vibe.",
      biggestWeaknessSpecific: "For me the one thing I'd look at is the energy in the middle. It settles into a comfortable groove but the dynamic curve kind of stays level when the track feels like it wants to climb more. Building in a bit more push and release in that section would give it a better arc and make the ending feel way more rewarding. Basically the potential is all there.",
    },
  },

  // Prime (Prod. moneyrake) by Dame$ — damianpierre955@gmail.com — QUEUED 0/1
  {
    trackId: "cmpsfw88v000304l2k2zozq3d",
    artistEmail: "damianpierre955@gmail.com",
    title: "Prime (Prod. moneyrake) by Dame$",
    reviewsRequested: 1,
    seedName: "Elliot Vance",
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "The energy on this is pretty hard to ignore. It hits well right from the jump and there's a clarity to the direction that makes it easy to follow through to the end. Instrumentation is on point too.",
      biggestWeaknessSpecific: "Only real note is around the mid section where the energy levels off a bit. Compared to how strong the opening is it starts to plateau and loses some of that forward momentum. A stronger push or some dynamic contrast in that part of the track would keep the listener locked in all the way through. Somthing to look at before final release.",
    },
  },
];

async function ensureSeeds() {
  const result: { id: string; name: string }[] = [];
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
    result.push({ id: profile.id, name: s.name });
  }
  return result;
}

async function main() {
  console.log("Ensuring seed profiles...");
  const allSeeds = await ensureSeeds();
  console.log(`${allSeeds.length} seeds ready\n`);

  for (const job of TRACKS) {
    console.log(`\n[TRACK] "${job.title}"`);

    const track = await prisma.track.findUnique({
      where: { id: job.trackId },
      select: { reviewsCompleted: true, reviewsRequested: true, status: true },
    });
    if (!track) { console.log("  NOT FOUND — skipping"); continue; }
    console.log(`  Status: ${track.status} | Progress: ${track.reviewsCompleted}/${track.reviewsRequested}`);

    const seed = allSeeds.find(s => s.name === job.seedName);
    if (!seed) throw new Error(`Seed not found: ${job.seedName}`);

    const alreadyReviewed = await prisma.review.findFirst({
      where: { trackId: job.trackId, peerReviewerArtistId: seed.id },
    });
    if (alreadyReviewed) {
      console.log(`  [SKIP] ${job.seedName} already reviewed this track`);
      continue;
    }

    const completed = track.reviewsCompleted + 1;
    const isNowComplete = completed >= job.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);
    const review = job.review;

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({ where: { trackId: job.trackId, artistReviewerId: seed.id } });

      await tx.review.create({
        data: {
          trackId: job.trackId,
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
        where: { id: job.trackId },
        data: {
          reviewsCompleted: completed,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          ...(isNowComplete ? { completedAt: new Date() } : {}),
        },
      });
    });

    console.log(`  [OK] ${job.seedName} → ${completed}/${job.reviewsRequested} ${isNowComplete ? "✓ COMPLETED" : ""}`);

    try {
      await sendReviewProgressEmail(job.artistEmail, job.title, completed, job.reviewsRequested);
      console.log(`  [EMAIL] ${isNowComplete ? "completion" : "progress"} → ${job.artistEmail}`);
    } catch (e) {
      console.error("  [EMAIL ERR]", e);
    }
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
