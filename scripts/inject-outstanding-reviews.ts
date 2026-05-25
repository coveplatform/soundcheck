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

// Real-looking seed profiles — names displayed to artists
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
  // ── Super hyper — Steve (0/3, needs 3) ────────────────────────────────────
  {
    trackId: "cmmpkqg5f000104jxhrfu0ipv",
    artistEmail: "cove.platform@proton.me",
    title: "Super hyper",
    startCompleted: 0,
    reviewsRequested: 3,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The sound design on this is really fun, the choices you made keep it feeling fresh and energetic all the way through.",
        biggestWeaknessSpecific: "For me the mix gets a bit busy as it builds. A lot of elements are competing in the same space and it starts to feel crowded. Giving some of those mid range elements more room to breathe would make the whole thing hit harder and feel cleaner.",
      },
      {
        firstImpression: "DECENT",
        productionScore: 4, vocalScore: 4, originalityScore: 4,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "TOO_NARROW", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY", nextFocus: "MIXING",
        bestPart: "The sonic palette here is really well chosen, everything feels like it belongs together and the production has a cohesive sound.",
        biggestWeaknessSpecific: "I think the mix could use a bit more separation between elements. Some things blend together in the mids in a way that makes it hard to pick out individual parts. A bit more clarity in that range would open the mix up and let the sound design shine more.",
      },
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "ACCEPTABLE", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The production is really polished, the mix feels clean and the sound design choices give it a lot of character and personality.",
        biggestWeaknessSpecific: "The high end feels slightly undefined in places, like it trails off without quite resolving. A bit more presence and airiness up there would give the track more life and make it feel more finished. Right now it sits just slightly short of where it could be.",
      },
    ],
  },

  // ── Genocidal Parasite — Ankoth (3/4, needs 1) ───────────────────────────
  {
    trackId: "cmngbmmqr000004jrkb3kjx8s",
    artistEmail: "shadowvonnyx@gmail.com",
    title: "Genocidal Parasite - Guitar Playthrough. #speedmetal #gothicmetal #thrashmetal",
    startCompleted: 3,
    reviewsRequested: 4,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: null, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "NOT_APPLICABLE", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_HARSH", stereoWidth: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The guitar tone here is genuinely great, the sound design choices for the lead and rhythm parts are well considered and complement each other really nicely.",
        biggestWeaknessSpecific: "The high mids feel a bit harsh in places which gets slightly fatiguing over time. There's a sharpness that could be smoothed out without losing any of the aggression. Also everthing sits at a similar level in the mix and a bit more dynamic range there would let the heavier moments really hit harder.",
      },
    ],
  },

  // ── Performing in the u.s.a — Kerian Jones (1/2, needs 1) ────────────────
  {
    trackId: "cmonieux5000304juqks9zw7o",
    artistEmail: "yousign71@gmail.com",
    title: "Performing in the u.s.a",
    startCompleted: 1,
    reviewsRequested: 2,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The sound design here suits the vibe of the track really well, the choices feel natural and considered and nothing feels out of place.",
        biggestWeaknessSpecific: "My main note is the mix feels a bit undefined in the mid range, like things are blending together when they should have more separation. It makes the overall picture feel slightly unclear in places. Getting more clarity in there would really help the important elements cut through.",
      },
    ],
  },

  // ── //REACH — John (1/2, needs 1) ────────────────────────────────────────
  {
    trackId: "cmoq8roqr000304ico642mt8f",
    artistEmail: "johnstanko1999@gmail.com",
    title: "//REACH",
    startCompleted: 1,
    reviewsRequested: 2,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "ACCEPTABLE", stereoWidth: "TOO_NARROW", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "SOUND_DESIGN",
        bestPart: "The sonic atmosphere on this is really well crafted, the sound design pulls you into its own world and the textures are genuinely interesting.",
        biggestWeaknessSpecific: "The high end feels a little closed off which makes the mix feel slightly small when I think it wants to feel expansive. There's not quite enough air and space up there to match the atmosphere you're going for. Opening that up would make the whole thing feel a lot more immersive.",
      },
    ],
  },

  // ── RYiBAuRdfhwHLUKf7w — maudwrxst] (0/1, needs 1) ──────────────────────
  {
    trackId: "cmp09dtc1000304johukfsogs",
    artistEmail: "williamsmaud1@gmail.com",
    title: "RYiBAuRdfhwHLUKf7w",
    startCompleted: 0,
    reviewsRequested: 1,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The sound design here has a lot of character, there are some interesting textural choices that give the track a distinct feel and keep things from feeling generic.",
        biggestWeaknessSpecific: "For me some of the elements feel like they're sitting in a similar space in the mix and it gets a bit hard to separate them out. The mid range in particular could use a bit more clarity and definition. Giving each element its own space would make the whole thing feel a lot more open.",
      },
    ],
  },

  // ── KKDNM, Rough Mix — Kadir Kırcan (0/2, needs 2) ──────────────────────
  {
    trackId: "cmp0uzl6z000004iib1wswcs8",
    artistEmail: "khadhirki@gmail.com",
    title: "KKDNM, Rough Mix by Kadir Kırcan",
    startCompleted: 0,
    reviewsRequested: 2,
    reviews: [
      {
        firstImpression: "LOST_INTEREST",
        productionScore: 2, vocalScore: 4, originalityScore: 2,
        wouldListenAgain: true,
        qualityLevel: "DEMO_STAGE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "ACCEPTABLE", stereoWidth: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "Even as a rough mix you can hear the interesting sonic ideas in here, the sound design has potential and the character comes through.",
        biggestWeaknessSpecific: "As expected with a rough mix the elements aren't sitting in their right places yet. The mids feel congested and things are overlapping in a way that makes it hard to read. Getting everthing properly placed will make a huge difference to how this comes across.",
      },
      {
        firstImpression: "LOST_INTEREST",
        productionScore: 2, vocalScore: 4, originalityScore: 2,
        wouldListenAgain: true,
        qualityLevel: "DEMO_STAGE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "TOO_NARROW", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The core sound design choices are solid, there's a good foundation here and the sonic direction feels clear even in rough form.",
        biggestWeaknessSpecific: "Things feel quite undefined across the mids and highs and there isn't much separation between the elements. It all kind of blurs together which makes it hard to focus on any one thing. A proper mix pass will transform this.",
      },
    ],
  },

  // ── Small Hands, Heavy Days — DistorcIA (0/1, needs 1) ───────────────────
  {
    trackId: "cmp1i0mzj000404l8obsadzhf",
    artistEmail: "brunodinitavares@gmail.com",
    title: "Small Hands, Heavy Days by DistorcIA",
    startCompleted: 0,
    reviewsRequested: 1,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 4, vocalScore: 4, originalityScore: 4,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "TOO_NARROW", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY", nextFocus: "MIXING",
        bestPart: "The sonic choices on this are really mature and considered, everthing feels like it was placed intentionally and the production has a lot of character.",
        biggestWeaknessSpecific: "For me the mix feels a bit flat in terms of depth and dimension. Things sit at roughly the same level and there isn't much front to back perspective. Some elements could sit further back to create more space for the important parts to come forward. That depth would make this feel a lot more engaging.",
      },
    ],
  },

  // ── Joyride Demo — Futuresexuals (0/2, needs 2) ──────────────────────────
  {
    trackId: "cmp1q5scu000004jp5ba3xxku",
    artistEmail: "futuresexuals@gmail.com",
    title: "Joyride Demo",
    startCompleted: 0,
    reviewsRequested: 2,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 2, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "DEMO_STAGE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The sound design on this is really promising, even as a demo the sonic choices feel intentional and there's a clear vision for what this track wants to be.",
        biggestWeaknessSpecific: "The mid range elements feel a bit undefined and things aren't sitting in quite the right places. There's some clashing happening that makes it feel slightly cluttered. A proper mix would really reveal how good this song is underneath.",
      },
      {
        firstImpression: "DECENT",
        productionScore: 2, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "DEMO_STAGE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "TOO_DULL", stereoWidth: "GOOD_BALANCE", dynamics: "ACCEPTABLE",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "The production ideas here are genuinely interesting, there's some really creative sound design that gives the track a lot of character.",
        biggestWeaknessSpecific: "For me the high end feels a little flat and doesn't quite give the track the shimmer it needs. It makes the overall mix feel slightly dull in places when I think it wants to feel more open and airy. Bringing a bit more presence to the top of the mix would make a real difference.",
      },
    ],
  },

  // ── Crash love — Yong LV (4/10 → 5/10, 1 review only, stays in progress) ─
  {
    trackId: "cmp5twadc000004jrox1i0xs5",
    artistEmail: "tdomingo839@gmail.com",
    title: "Crash love",
    startCompleted: 4,
    reviewsRequested: 10,
    reviews: [
      {
        firstImpression: "DECENT",
        productionScore: 3, vocalScore: 4, originalityScore: 3,
        wouldListenAgain: true,
        qualityLevel: "ALMOST_THERE",
        vocalClarity: "CRYSTAL_CLEAR", lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED",
        trackLength: "PERFECT", tooRepetitive: false,
        playlistAction: "LET_PLAY", nextFocus: "MIXING",
        bestPart: "Something about the way the track opens up mid way through, the sound design just clicks and you feel it shift. Really well done.",
        biggestWeaknessSpecific: "The mix feels a bit crowded in places, like certain elements are competing for the same space. Some things could sit back more in the mids and let the more important parts breathe. Its not a huge issue but cleaning that up would make the whole thing feel more open.",
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

    // Find which seeds have already reviewed this track
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
    const milestoneFull = job.reviewsRequested;

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
      const crossedFull = prevCompleted < milestoneFull && completed >= milestoneFull;
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
            select: { wouldAddToPlaylist: true, wouldShare: true, wouldFollow: true, wouldListenAgain: true },
          });
          const pct = (field: "wouldAddToPlaylist" | "wouldShare" | "wouldFollow" | "wouldListenAgain") => {
            const vals = intentReviews.filter((r) => r[field] !== null);
            if (vals.length === 0) return null;
            return Math.round((vals.filter((r) => r[field] === true).length / vals.length) * 100);
          };
          await sendListenerIntentEmail({
            artistEmail: job.artistEmail,
            trackTitle: job.title,
            trackId: job.trackId,
            reviewCount: completed,
            playlistPct: pct("wouldAddToPlaylist"),
            sharePct: pct("wouldShare"),
            followPct: pct("wouldFollow"),
            listenAgainPct: pct("wouldListenAgain"),
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
