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

const TRACK_ID = "cmou8kn4r000004l1y3ghnvg5";
const ARTIST_EMAIL = "floydkelly2012@gmail.com";
const TRACK_TITLE = "Floyd Kelly - Happy Birthday, USA";

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

const REVIEWS = [
  // 1 — we are the world, production focused
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "this sounds like it was recorded properly you know what i mean. like everything sits right and the whole production has this big clean 80s thing going on. reminds me of we are the world in the best way, that kind of big polished anthem sound",
    biggestWeaknessSpecific: "only thing is it ends too quick. im fully into it and then its over and im like wait thats it. could easily go longer and it would hold. dont cut yourself short on the runtime definatley",
  },
  // 2 — just vibing, mix/feel focused
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "wow this is real nice man. everything just sits so well together and the whole thing sounds warm and full. put this on and u just feel good thats it",
    biggestWeaknessSpecific: "middle section stays pretty level for a while and i kept waiting for it to push a bit harder. not a big deal but even just a small lift before the end wouldve made the whole thing feel bigger. still really solid though",
  },
  // 3 — honest, bit generic
  {
    firstImpression: "DECENT" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 3,
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
    bestPart: "mix is clean and everything comes through clearly. u can tell this was done properly, nothing sounds out of place and the overall sound is well balanced throughout",
    biggestWeaknessSpecific: "gonna be honest the concept feels a bit familiar and it doesnt quite do enough to seperate itself from stuff thats already out there. its nice and well made but plays it safe. think u could push the idea somewhere more intresting if u took a few risks. the production is there just needs more of an angle",
  },
  // 4 — excited and messy, energy/feel
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "bro this just makes u feel good instantly. the energy is there from the jump and the whole thing just sounds massive. proper feel good track, put this on at a party and everyone would be into it",
    biggestWeaknessSpecific: "it finishes too soon thats my only thing. i was fully in it and then it just ended. u want it to go on longer. let it breathe a bit more before closing it out, it can handle the runtime easily",
  },
  // 5 — short punchy, arrangement/structure
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "this is genuinely lovely. everything sounds so clean and warm and it just flows really naturally from start to finish. exactley the kind of thing id put on in the background and then find myself properly listening to",
    biggestWeaknessSpecific: "could be longer thats it. last part hits and ur waiting for one more push and it doesnt come. another 45 seconds or a bigger final moment and this would be completley spot on",
  },
  // 6 — cinematic, atmospheric, no vocals mention
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "sounds like it belongs at the end of a film or somthing. like one of those big sweeping moments. the way the whole thing is arranged just builds this feeling and it works really well",
    biggestWeaknessSpecific: "second half doesnt go as big as i expected. sets up this big expectation and then just kind of maintains. needed to push harder at the end. as it is it arrives rather than lands if that makes sense. more contrast in that section and it would of been a proper moment",
  },
  // 7 — very casual, short reaction
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "this just works man. dont know what else to say. put it on and u just want to keep listening. the whole mix sounds full and warm right from the start",
    biggestWeaknessSpecific: "honestly just wish there was more of it. the track ends and i genuinely wanted another minute at least. feels like it just gets going and then wraps up. u clearly have the material to sustain something longer so just go for it",
  },
  // 8 — mix focused, headphones/speakers angle
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 4,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "the mix on this is really well done. everything has its own space and nothings fighting for attention. sounds great on speakers, sounds great on headphones. that kind of track u can just tell was done with care",
    biggestWeaknessSpecific: "the second half kind of plateaus for me. like it reaches a certain level and just stays there when i was expecting it to push even further. a bit more movment in that section and the whole thing would feel like more of a journey rather than just cruising",
  },
  // 9 — hooky/catchy angle, replay value
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "this got stuck in my head after one listen which doesnt happen often. theres somthing really hooky about the whole feel of it that just sticks with you. really enjoyable track, proper feel good stuff",
    biggestWeaknessSpecific: "the pacing dips a little in the middle section for me. like things settle a bit too early and dont quite recover to the same level they were at. keeping that energy up through the whole thing would make it an easy replay every time",
  },
  // 10 — celebratory/event feel, wants a bigger ending
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4, vocalScore: 4, originalityScore: 5,
    wouldListenAgain: true,
    qualityLevel: "RELEASE_READY" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: "ADD_TO_LIBRARY" as const,
    nextFocus: "ARRANGEMENT" as const,
    bestPart: "sounds like a proper celebration. the whole thing just feels big and warm and like something u would actually play at an event. really cool vibe to it, everything sits together nicely",
    biggestWeaknessSpecific: "could be longer for me. the track does everything right but it wraps up before u feel like the moment has fully landed. give it a bigger ending and more room to breathe and this would be something really specail honestly",
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
  if (available.length < needed) {
    throw new Error(`Not enough unused seeds (need ${needed}, found ${available.length})`);
  }

  let completed = track.reviewsCompleted;

  for (let i = 0; i < needed; i++) {
    const seed = available[i];
    const review = REVIEWS[i];
    completed += 1;
    const isNowComplete = completed >= track.reviewsRequested;
    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 120 + Math.floor(Math.random() * 180);

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({
        where: { trackId: TRACK_ID, artistReviewerId: seed.id },
      });

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
