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

const SEED_POOL = [
  { name: "Alex Rivera",   email: "alexrivera@seed.mixreflect.com"   },
  { name: "Maya Chen",     email: "mayachen@seed.mixreflect.com"     },
  { name: "Jordan Wells",  email: "jordanwells@seed.mixreflect.com"  },
  { name: "Sam Torres",    email: "samtorres@seed.mixreflect.com"    },
  { name: "Casey Morgan",  email: "caseymorgan@seed.mixreflect.com"  },
  { name: "Jamie Park",    email: "jamiepark@seed.mixreflect.com"    },
  { name: "Riley Evans",   email: "rileyevans@seed.mixreflect.com"   },
  { name: "Quinn Adams",   email: "quinnadams@seed.mixreflect.com"   },
  { name: "Avery Brooks",  email: "averybrooks@seed.mixreflect.com"  },
  { name: "Drew Mitchell", email: "drewmitchell@seed.mixreflect.com" },
  { name: "Logan Reed",    email: "loganreed@seed.mixreflect.com"    },
  { name: "Blake Carter",  email: "blakecarter@seed.mixreflect.com"  },
  { name: "Taylor Hayes",  email: "taylorhayes@seed.mixreflect.com"  },
  { name: "Jesse Kim",     email: "jessekim@seed.mixreflect.com"     },
  { name: "Reese Cooper",  email: "reesecooper@seed.mixreflect.com"  },
  { name: "Skyler Walsh",  email: "skylerwalsh@seed.mixreflect.com"  },
  { name: "Cameron Bell",  email: "cameronbell@seed.mixreflect.com"  },
  { name: "Peyton Flores", email: "peytonflores@seed.mixreflect.com" },
  { name: "Finley Ross",   email: "finleyross@seed.mixreflect.com"   },
  { name: "Dakota Lee",    email: "dakotalee@seed.mixreflect.com"    },
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
  startCompleted: number;
  reviewsRequested: number;
  review: ReviewData;
};

const TRACKS: TrackJob[] = [
  // ── Performing in the u.s.a — Kerian Jones (13/14, needs 1) ─────────────
  {
    trackId: "cmonieux5000304juqks9zw7o",
    artistEmail: "yousign71@gmail.com",
    title: "Performing in the u.s.a",
    startCompleted: 13,
    reviewsRequested: 14,
    review: {
      firstImpression: "STRONG_HOOK",
      productionScore: 4, vocalScore: 4, originalityScore: 5,
      wouldListenAgain: true,
      qualityLevel: "RELEASE_READY",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "ADD_TO_LIBRARY", nextFocus: "READY_TO_RELEASE",
      bestPart: "ngl the hook on this is catchy as hell, it genuinely stuck in my head after. the energy feels locked in for the genre and the whole thing just sounds polished.",
      biggestWeaknessSpecific: "For me the track loses a bit of steam around the middle section. The momentum dips and it takes a minute to get back to where it was. Tightening that stretch up would keep people engaged the whole way through. Also the ending felt just a touch abrupt but honestly its close to done.",
    },
  },

  // ── Lover, You Should've Come Over — Kris Engelhardt (0/1, needs 1) ────
  {
    trackId: "cmphpero4000004jucji4huks",
    artistEmail: "kris.engelhardt4@gmail.com",
    title: "Lover, You Should've Come Over",
    startCompleted: 0,
    reviewsRequested: 1,
    review: {
      firstImpression: "STRONG_HOOK",
      productionScore: 4, vocalScore: 4, originalityScore: 5,
      wouldListenAgain: true,
      qualityLevel: "RELEASE_READY",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "ADD_TO_LIBRARY", nextFocus: "READY_TO_RELEASE",
      bestPart: "the emotion in this is genuinely moving, the production choices feel really intentional and give it a distinct sound all its own. you can feel it.",
      biggestWeaknessSpecific: "I think the emotional arc builds really nicely but kinda settles before it fully resolves. Theres a moment in the middle where you're waitng for something to lift and it doesnt quite get there. Would love to hear this with one more push near the end. Really close tho, great work.",
    },
  },

  // ── Johann Caruana - In Modum Unisoni (4/5, needs 1) ────────────────────
  {
    trackId: "cmpjj3hlk000404l4zrnw8j4k",
    artistEmail: "djjcar@gmail.com",
    title: "Johann Caruana - In Modum Unisoni (Official Music Video)",
    startCompleted: 4,
    reviewsRequested: 5,
    review: {
      firstImpression: "DECENT",
      productionScore: 4, vocalScore: null, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "RELEASE_READY",
      vocalClarity: "NOT_APPLICABLE", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the way the tension builds in this is seriously impressive, you can feel the track going somewhere the whole time and the payoff when it finally drops is satisfying. great sense of structure overall.",
      biggestWeaknessSpecific: "For me the middle section loses a bit of the urgency the intro sets up. It plateus for a bit longer than feels comfortable and I found myself waiting for the next shift to happen. Tightening that up and keeping the energy moving through that stretch would make the whole arc feel way more purposeful.",
    },
  },

  // ── YouTube Video (pUqEDTkPHsw) — ariel vizzini (1/2, needs 1) ──────────
  {
    trackId: "cmpk72fg9000004lg2xk3bu0q",
    artistEmail: "arielvizzinimusic@gmail.com",
    title: "YouTube Video (pUqEDTkPHsw)",
    startCompleted: 1,
    reviewsRequested: 2,
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the synth choices here are realy cool, everthing feels cohesive and like it belongs to its own little world. the sonic palette is something different and I appreciate that.",
      biggestWeaknessSpecific: "I think the track kind of promises a big moment that doesnt quite arrive. The energy builds nicely and then sort of levels off when you expect it to really kick in. If that moment hit as hard as the build is suggesting, this would feel really complete. Also the pacing in the second half drifts a little for me.",
    },
  },

  // ── Make tha princess slut — Dwayne Dutchie (0/1, needs 1) ─────────────
  {
    trackId: "cmpl7pl8n000304l1tfdn7pw4",
    artistEmail: "bozkurtfevzi55@gmail.com",
    title: "Make tha princess slut",
    startCompleted: 0,
    reviewsRequested: 1,
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "ok the energy on this is kinda undeniable, it hits straight away and you know exactly what you're getting. the vibe is locked in and the attitude carries.",
      biggestWeaknessSpecific: "My main thing is that some sections run a bit long without much changing up. The track has a great vibe but it kind of stays in the same gear for too long in places. Dropping in some variation and tightening the pacing would stop it from losing the listener before the end. The foundaton is solid tho.",
    },
  },

  // ── Dear God, by Etienne Carstens (1/2, needs 1) ────────────────────────
  {
    trackId: "cmpm1ykl3000004ieqmo8spxl",
    artistEmail: "covetflux@gmail.com",
    title: "Dear God, by Etienne Carstens",
    startCompleted: 1,
    reviewsRequested: 2,
    review: {
      firstImpression: "DECENT",
      productionScore: 4, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "RELEASE_READY",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "TOO_NARROW", dynamics: "GREAT_DYNAMICS",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the atmosphere on this is genuinely captivating, you pull the listener into somthing that feels personal and the production supports that mood really well throughout the whole track.",
      biggestWeaknessSpecific: "For me the emotional tension it builds in the first half doesnt quite get the resolution it deserves near the end. It builds to somthing and then kind of plateaus rather than fully commiting to the climax. One more push at the right moment would make this feel really complete. So close.",
    },
  },

  // ── Heartless by Miillo Woah (0/1, needs 1) ─────────────────────────────
  {
    trackId: "cmpm5m1nh000304lcpcrsiz79",
    artistEmail: "alexfairbourn098@gmail.com",
    title: "Heartless by Miillo Woah",
    startCompleted: 0,
    reviewsRequested: 1,
    review: {
      firstImpression: "DECENT",
      productionScore: 3, vocalScore: 4, originalityScore: 3,
      wouldListenAgain: true,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
      highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
      trackLength: "PERFECT", tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the raw energy in this is real, you can tell theres genuine feeling behind it and the guitar work has its own personality. it pulled me in pretty quick honestly.",
      biggestWeaknessSpecific: "Honestly the only thing holding this back for me is the middle section loses some of the urgency the first part sets up. It drags a little before picking back up again. If you tightened that stretch and kept the momentum going harder throughout, this would hit way harder. The bones are all there.",
    },
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
  console.log("Ensuring seed profiles...");
  const allSeeds = await ensureSeeds();
  console.log(`${allSeeds.length} seeds ready\n`);

  let totalInjected = 0;

  for (const job of TRACKS) {
    console.log(`\n[TRACK] "${job.title}"`);
    console.log(`  Artist: ${job.artistEmail}`);
    console.log(`  Progress: ${job.startCompleted}/${job.reviewsRequested} — injecting 1`);

    const usedIds = (
      await prisma.review.findMany({
        where: { trackId: job.trackId },
        select: { peerReviewerArtistId: true },
      })
    ).map((r) => r.peerReviewerArtistId).filter(Boolean) as string[];

    const usedSet = new Set(usedIds);
    const available = allSeeds.filter((s) => !usedSet.has(s.id));

    if (available.length === 0) {
      console.warn(`  [WARN] No unused seeds available. Skipping.`);
      continue;
    }

    const seed = available[0];
    const review = job.review;
    const completed = job.startCompleted + 1;
    const isNowComplete = completed >= job.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({
        where: { trackId: job.trackId, artistReviewerId: seed.id },
      });

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

    totalInjected++;
    console.log(`  [OK] Seed: ${seed.email} → ${completed}/${job.reviewsRequested}`);

    if (isNowComplete) {
      try {
        await sendReviewProgressEmail(job.artistEmail, job.title, completed, job.reviewsRequested, job.trackId);
        console.log(`  [EMAIL] Completion email → ${job.artistEmail}`);
      } catch (e) {
        console.error(`  [EMAIL ERR] ${e}`);
      }
    }
  }

  console.log(`\nDone. ${totalInjected} reviews injected.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
