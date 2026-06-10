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
  { name: "Alex Rivera",      email: "alexrivera@seed.mixreflect.com"      },
  { name: "Maya Chen",        email: "mayachen@seed.mixreflect.com"        },
  { name: "Jordan Wells",     email: "jordanwells@seed.mixreflect.com"     },
  { name: "Sam Torres",       email: "samtorres@seed.mixreflect.com"       },
  { name: "Casey Morgan",     email: "caseymorgan@seed.mixreflect.com"     },
  { name: "Jamie Park",       email: "jamiepark@seed.mixreflect.com"       },
  { name: "Riley Evans",      email: "rileyevans@seed.mixreflect.com"      },
  { name: "Quinn Adams",      email: "quinnadams@seed.mixreflect.com"      },
  { name: "Avery Brooks",     email: "averybrooks@seed.mixreflect.com"     },
  { name: "Drew Mitchell",    email: "drewmitchell@seed.mixreflect.com"    },
  { name: "Logan Reed",       email: "loganreed@seed.mixreflect.com"       },
  { name: "Blake Carter",     email: "blakecarter@seed.mixreflect.com"     },
  { name: "Taylor Hayes",     email: "taylorhayes@seed.mixreflect.com"     },
  { name: "Jesse Kim",        email: "jessekim@seed.mixreflect.com"        },
  { name: "Reese Cooper",     email: "reesecooper@seed.mixreflect.com"     },
  { name: "Skyler Walsh",     email: "skylerwalsh@seed.mixreflect.com"     },
  { name: "Cameron Bell",     email: "cameronbell@seed.mixreflect.com"     },
  { name: "Peyton Flores",    email: "peytonflores@seed.mixreflect.com"    },
  { name: "Finley Ross",      email: "finleyross@seed.mixreflect.com"      },
  { name: "Dakota Lee",       email: "dakotalee@seed.mixreflect.com"       },
  { name: "Morgan Price",     email: "morganprice@seed.mixreflect.com"     },
  { name: "Rowan Scott",      email: "rowanscott@seed.mixreflect.com"      },
  { name: "Harley James",     email: "harleyjames@seed.mixreflect.com"     },
  { name: "Emery Cole",       email: "emerycole@seed.mixreflect.com"       },
  { name: "Phoenix Gray",     email: "phoenixgray@seed.mixreflect.com"     },
];

type Review = {
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  productionScore: number;
  vocalScore: number | null;
  originalityScore: number;
  wouldListenAgain: boolean;
  qualityLevel: "PROFESSIONAL" | "RELEASE_READY" | "ALMOST_THERE" | "DEMO_STAGE" | "NOT_READY";
  vocalClarity: "CRYSTAL_CLEAR" | "BURIED" | "NOT_APPLICABLE";
  lowEndClarity: "PERFECT" | "BOTH_MUDDY";
  highEndQuality: "PERFECT" | "TOO_HARSH";
  stereoWidth: "GOOD_BALANCE" | "TOO_NARROW";
  dynamics: "GREAT_DYNAMICS" | "TOO_COMPRESSED";
  trackLength: "PERFECT" | "WAY_TOO_LONG";
  tooRepetitive: boolean;
  playlistAction: "ADD_TO_LIBRARY" | "LET_PLAY" | "SKIP";
  nextFocus: string;
  bestPart: string;
  biggestWeaknessSpecific: string;
};

type TrackDef = {
  id: string;
  title: string;
  artistEmail: string;
  reviews: Review[];
};

const TRACKS: TrackDef[] = [
  {
    id: "cmonieux5000304juqks9zw7o",
    title: "Performing in the u.s.a",
    artistEmail: "yousign71@gmail.com",
    reviews: [
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "the energy here is instantly grabbing. i found myself nodding along from the first few seconds and it never really let go of me. somthing about the groove just works, really cool track",
        biggestWeaknessSpecific: "for me the only thing i'd say is the mid section loses a bit of steam compared to how strong the opener is. the rest of the track is so confident that that brief dip stands out a little. pushing the energy back up sooner would help it feel like a complete journey from start to finish.",
      },
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "this is genuinely one of those tracks i'd add to a playlist without hesitation. the groove is there, the feel is right, and it just sounds completley ready. like proper ready",
        biggestWeaknessSpecific: "i think there's a point around the middle where things settle a bit too comfortably and the track stays in that zone a little long before picking back up again. it's not a big deal but even a small shift in the energy there would give the whole listen a better arc overall.",
      },
    ],
  },
  {
    id: "cmp96lnq9000204kw29o6y6wv",
    title: "Forgiveness",
    artistEmail: "jamallee410@icloud.com",
    reviews: [
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "the emotional weight of this comes through immediately. theres something real and genuine in the delivery that makes you stop and actually listen. really moves you",
        biggestWeaknessSpecific: "the one thing i'd look at is the section in the middle where the energy kind of plateaus for a bit. the track has such a strong emotional pull at the start that when things settle it breaks the spell slightly. keeping that forward momentum would really help the listener stay fully locked in the whole way through.",
      },
    ],
  },
  {
    id: "cmpaevof2000004jmthmnxx00",
    title: "Te Aroha",
    artistEmail: "kris.engelhardt4@gmail.com",
    reviews: [
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "this is genuinely beautiful and i don't say that lightly. the atmosphere pulled me in from the very first note and held me there the whole way. definitley going on repeat",
        biggestWeaknessSpecific: "for me i felt like the big emotional peak came a tiny bit later than i was expecting. i was building toward it and then it took just a moment longer to arrive than felt natural. moving that payoff slightly earlier might help the emotional arc feel even more satisfying and completley intentional. really lovely track though.",
      },
    ],
  },
  {
    id: "cmpatwglb000004js5xoklnll",
    title: "MNGA Music- In God We Trust",
    artistEmail: "sophiapeletier11051998@gmail.com",
    reviews: [
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "there's a real conviction in this that's hard to fake. the message is clear and the track backs it up in a way that feels powerfull and sincere. i was genuinely into it",
        biggestWeaknessSpecific: "my main feedback is about the middle section where things feel like they plateau a bit. the track settles into a groove and stays there a little longer than it needs to before finding its way to the next moment. some kind of shift or development in that part would give listeners more to follow and make the whole thing feel more dynamic.",
      },
    ],
  },
  {
    id: "cmpbdimnw000104l11p4fyz6w",
    title: "Kryrella's Dream",
    artistEmail: "elibanks2008@gmail.com",
    reviews: [
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "the atmosphere here is something else. i could completley picture a whole world while listening and that kind of immersive quality is genuinely rare. really impressive stuff",
        biggestWeaknessSpecific: "the one thing i'd look at is the ending. the track does such a great job of building a mood but i felt like the resolution came a bit suddenly. i wanted just a little more time to let the atmoshpere settle before it closed out. a slightly longer wind-down would make the whole experience feel more intentional and give it a more satisfying finish.",
      },
    ],
  },
  {
    id: "cmpbxoox8000004jl920shvoy",
    title: "Performative - ariel vizzini",
    artistEmail: "arielvizzinimusic@gmail.com",
    reviews: [
      {
        firstImpression: "STRONG_HOOK",
        productionScore: 4, vocalScore: 4, originalityScore: 5,
        wouldListenAgain: true,
        qualityLevel: "RELEASE_READY",
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        trackLength: "PERFECT",
        tooRepetitive: false,
        playlistAction: "ADD_TO_LIBRARY",
        nextFocus: "ARRANGEMENT",
        bestPart: "this caught me off guard in a really good way. theres something unique about how this is put together that made me want to keep listening and figure out what makes it tick. really cool",
        biggestWeaknessSpecific: "for me the energy stays at a pretty consitent level throughout and i think there are moments where it could push harder or pull back to create more contrast. some dynamic variation through the middle would make the peaks hit with more impact and give the track more of a journey feeling overall.",
      },
    ],
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
  const allSeeds = await ensureSeeds();
  console.log(`[INFO] ${allSeeds.length} seed reviewers ready\n`);

  for (const trackDef of TRACKS) {
    const track = await prisma.track.findUnique({
      where: { id: trackDef.id },
      select: { reviewsCompleted: true, reviewsRequested: true },
    });
    if (!track) {
      console.log(`[SKIP] Track not found: ${trackDef.id}`);
      continue;
    }

    const remaining = track.reviewsRequested - track.reviewsCompleted;
    if (remaining <= 0) {
      console.log(`[SKIP] "${trackDef.title}" — already complete`);
      continue;
    }

    const usedIds = (
      await prisma.review.findMany({
        where: { trackId: trackDef.id },
        select: { peerReviewerArtistId: true },
      })
    ).map(r => r.peerReviewerArtistId).filter(Boolean) as string[];
    const usedSet = new Set(usedIds);

    const available = allSeeds.filter(s => !usedSet.has(s.id));
    const needed = Math.min(trackDef.reviews.length, remaining);

    if (available.length < needed) {
      throw new Error(`Not enough unused seeds for "${trackDef.title}" (need ${needed}, found ${available.length})`);
    }

    let completed = track.reviewsCompleted;
    console.log(`[TRACK] "${trackDef.title}" — ${completed}/${track.reviewsRequested}, injecting ${needed}`);

    for (let i = 0; i < needed; i++) {
      const seed = available[i];
      const review = trackDef.reviews[i];
      completed += 1;
      const isNowComplete = completed >= track.reviewsRequested;
      const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
      const listenDuration = 120 + Math.floor(Math.random() * 180);

      await prisma.$transaction(async (tx) => {
        await tx.reviewQueue.deleteMany({
          where: { trackId: trackDef.id, artistReviewerId: seed.id },
        });

        await tx.review.create({
          data: {
            trackId: trackDef.id,
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
          where: { id: trackDef.id },
          data: {
            reviewsCompleted: completed,
            status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
            ...(isNowComplete ? { completedAt: new Date() } : {}),
          },
        });
      });

      console.log(`  [OK] Review ${i + 1}/${needed} — ${seed.email} → ${completed}/${track.reviewsRequested}`);

      try {
        await sendReviewProgressEmail(trackDef.artistEmail, trackDef.title, completed, track.reviewsRequested);
        console.log(`  [EMAIL] ${isNowComplete ? "completion" : "progress"} → ${trackDef.artistEmail}`);
      } catch (e) {
        console.error(`  [EMAIL ERR]`, e);
      }
    }

    console.log();
  }

  console.log("Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
