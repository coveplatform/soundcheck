import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { sendReviewProgressEmail, sendListenerIntentEmail } from "../src/lib/email/reviews";

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
  { name: "Alex Rivera",    email: "alexrivera@seed.mixreflect.com"    },
  { name: "Maya Chen",      email: "mayachen@seed.mixreflect.com"      },
  { name: "Jordan Wells",   email: "jordanwells@seed.mixreflect.com"   },
  { name: "Sam Torres",     email: "samtorres@seed.mixreflect.com"     },
  { name: "Casey Morgan",   email: "caseymorgan@seed.mixreflect.com"   },
  { name: "Jamie Park",     email: "jamiepark@seed.mixreflect.com"     },
  { name: "Riley Evans",    email: "rileyevans@seed.mixreflect.com"    },
  { name: "Quinn Adams",    email: "quinnadams@seed.mixreflect.com"    },
  { name: "Avery Brooks",   email: "averybrooks@seed.mixreflect.com"   },
  { name: "Drew Mitchell",  email: "drewmitchell@seed.mixreflect.com"  },
  { name: "Logan Reed",     email: "loganreed@seed.mixreflect.com"     },
  { name: "Blake Carter",   email: "blakecarter@seed.mixreflect.com"   },
  { name: "Taylor Hayes",   email: "taylorhayes@seed.mixreflect.com"   },
  { name: "Jesse Kim",      email: "jessekim@seed.mixreflect.com"      },
  { name: "Reese Cooper",   email: "reesecooper@seed.mixreflect.com"   },
  { name: "Skyler Walsh",   email: "skylerwalsh@seed.mixreflect.com"   },
  { name: "Cameron Bell",   email: "cameronbell@seed.mixreflect.com"   },
  { name: "Peyton Flores",  email: "peytonflores@seed.mixreflect.com"  },
  { name: "Finley Ross",    email: "finleyross@seed.mixreflect.com"    },
  { name: "Dakota Lee",     email: "dakotalee@seed.mixreflect.com"     },
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
  reviews: ReviewData[];
};

const TRACKS: TrackJob[] = [
  // ── Performing in the u.s.a — Kerian Jones (11/13, needs 2) ──────────────
  {
    trackId: "cmonieux5000304juqks9zw7o",
    artistEmail: "yousign71@gmail.com",
    title: "Performing in the u.s.a",
    startCompleted: 11,
    reviewsRequested: 13,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "the groove on this actually locks in pretty well, especially when it kicks into the chorus, that part carries the whole track",
        biggestWeaknessSpecific: "not really my type of music if im honest but i can see what its going for and it works. on my setup it feels a bit harsh in the upper mids - like something around 3-5k is sitting a little hot. some light eqing there would smooth it out. overall pretty solid tho",
      },
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "liked the energy here, the momentum builds up nicely through the song and it doesnt lose you along the way",
        biggestWeaknessSpecific: "this isnt usually what i listen to but honestly i get the appeal. one thing i noticed is it sounds a bit sharp on my speakers - maybe some brightness in the highs that could be dialed back a touch. a small eq tweak would probly do it. but yeah decent production for what it is",
      },
    ],
  },

  // ── Memory Cruise '26 — Just3l (0/1, needs 1) ────────────────────────────
  {
    trackId: "cmpcpx5im000304jpprl5ih69",
    artistEmail: "justas12js@gmail.com",
    title: "Memory Cruise '26 - Original Mix by Just3l",
    startCompleted: 0,
    reviewsRequested: 1,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "the way it builds through the middle section is well done, it draws you in and the transitions feel natural and thought out",
        biggestWeaknessSpecific: "not really my usual genre but the production is cleaner than i expected. it does come across a little harsh on my end - something in the high mids i think, maybe worth a small eq pass in that range. but its a solid track and the mix mostly holds up well throughout",
      },
    ],
  },

  // ── Hagamos una última canción — Cristian Ortiz Remacha (0/1, needs 1) ───
  {
    trackId: "cmpd6yrij000404l1lpop5jt6",
    artistEmail: "cristianortizremacha@gmail.com",
    title: "Hagamos una última canción (Rock Tango fusión)",
    startCompleted: 0,
    reviewsRequested: 1,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "the fusion angle is actually pretty interesting, the tango elements come through clearly and give it a real distinct character that you dont hear often",
        biggestWeaknessSpecific: "defintely not what i usually listen to but its genuinely cool and the concept works. on my setup it hits a bit harsh in places - feels like something in the upper mids or highs is a touch bright. some light eqing there could clean it up. but the energy and the playing are both on point, good stuff",
      },
    ],
  },

  // ── res cogitans — Drunk Ancestor (4/5, needs 1) ─────────────────────────
  {
    trackId: "cmpg0uui4000304l8ofxexoyx",
    artistEmail: "oliverlardner@gmail.com",
    title: "res cogitans",
    startCompleted: 4,
    reviewsRequested: 5,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "the atmosphere on this is actually really well built, it pulls you into the mood early and keeps it consistent all the way through to the end",
        biggestWeaknessSpecific: "not my normal thing but the production on this is interesting. it does feel a bit harsh in certain moments on my end - think its sitting somewhere in the high mids, maybe some slight eqing around there would help. overall tho its a well constructed track, more to it than first glance",
      },
    ],
  },

  // ── Johann Caruana - Shattering (2/3, needs 1) ───────────────────────────
  {
    trackId: "cmpgswew8000004kv8pk30ois",
    artistEmail: "djjcar@gmail.com",
    title: "Johann Caruana - Shattering (Official Lyric Music Video)",
    startCompleted: 2,
    reviewsRequested: 3,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "the chorus lands really well on this, its the kind of moment that justifies the build up and it delivers in a way that feels earned and not rushed",
        biggestWeaknessSpecific: "not my usual type of music but the production is better than i expected. it does come across a little harsh on my end - maybe in the highs or upper mids, just a touch bright on my speakers. some light eqing around that range would help smooth it out. but yeah solid track overall, good energy",
      },
    ],
  },
];

const LISTENER_INTENT_THRESHOLD = 3;

async function main() {
  console.log("Ensuring seed profiles...");
  const allSeeds = await ensureSeeds();
  console.log(`${allSeeds.length} seeds ready\n`);

  let totalInjected = 0;

  for (const job of TRACKS) {
    console.log(`\n[TRACK] "${job.title}"`);
    console.log(`  Progress: ${job.startCompleted}/${job.reviewsRequested} — injecting ${job.reviews.length}`);

    const usedIds = (
      await prisma.review.findMany({
        where: { trackId: job.trackId },
        select: { peerReviewerArtistId: true },
      })
    ).map((r) => r.peerReviewerArtistId).filter(Boolean) as string[];

    const usedSet = new Set(usedIds);
    const available = allSeeds.filter((s) => !usedSet.has(s.id));

    if (available.length < job.reviews.length) {
      console.warn(`  [WARN] Not enough unused seeds (need ${job.reviews.length}, have ${available.length}). Skipping track.`);
      continue;
    }

    let completed = job.startCompleted;
    const milestoneHalf = Math.ceil(job.reviewsRequested / 2);

    for (let i = 0; i < job.reviews.length; i++) {
      const seed = available[i];
      const review = job.reviews[i];
      const prevCompleted = completed;
      completed += 1;

      const isNowComplete = completed >= job.reviewsRequested;
      const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
      const listenDuration = 120 + Math.floor(Math.random() * 240);

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
      console.log(`  [OK] ${i + 1}/${job.reviews.length} — ${seed.email} → ${completed}/${job.reviewsRequested}`);

      const crossedHalf = prevCompleted < milestoneHalf && completed >= milestoneHalf;
      const crossedFull = isNowComplete && prevCompleted < job.reviewsRequested;
      const crossedIntent = prevCompleted < LISTENER_INTENT_THRESHOLD && completed >= LISTENER_INTENT_THRESHOLD;

      if (crossedHalf || crossedFull) {
        try {
          await sendReviewProgressEmail(job.artistEmail, job.title, completed, job.reviewsRequested);
          const label = crossedFull ? "completion" : "50%";
          console.log(`  [EMAIL] ${label} email → ${job.artistEmail}`);
        } catch (e) {
          console.error("  [EMAIL ERR] Progress email failed:", e);
        }
      }

      if (crossedIntent) {
        try {
          const intentReviews = await prisma.review.findMany({
            where: { trackId: job.trackId, status: "COMPLETED", countsTowardAnalytics: true },
            select: { wouldListenAgain: true },
          });
          const listenAgainPct = (() => {
            const vals = intentReviews.filter((r) => r.wouldListenAgain !== null);
            if (vals.length === 0) return null;
            return Math.round((vals.filter((r) => r.wouldListenAgain === true).length / vals.length) * 100);
          })();
          await sendListenerIntentEmail({
            artistEmail: job.artistEmail,
            trackTitle: job.title,
            trackId: job.trackId,
            reviewCount: completed,
            playlistPct: null,
            sharePct: null,
            followPct: null,
            listenAgainPct,
          });
          console.log(`  [EMAIL] Listener intent email → ${job.artistEmail}`);
        } catch (e) {
          console.error("  [EMAIL ERR] Listener intent email failed:", e);
        }
      }
    }
  }

  console.log(`\nDone. ${totalInjected} reviews injected.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
