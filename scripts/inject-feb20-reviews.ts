/**
 * Injects remaining peer reviews for tracks with open slots as of 20/02/2026:
 *   - RageMinorant2           (xavierdupont1930@gmail.com)    — 1 remaining
 *   - scaryyyy                (chanelbaidjoe14@gmail.com)     — 2 remaining
 *   - Things I Never Said     (romeo.juank@gmail.com)         — 1 remaining
 *   - 1802                    (gleb.demonist@gmail.com)       — 2 remaining
 *   - TRACKS ON MY MIND VOL01 (anxymusic.anxy@gmail.com)      — 2 remaining
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/inject-feb20-reviews.ts
 */

import { prisma } from "../src/lib/prisma";

const TARGETS: Array<{
  ownerEmail: string;
  trackHint?: string;
  needed: number;
  reviews: ReviewTemplate[];
}> = [
  {
    ownerEmail: "xavierdupont1930@gmail.com",
    trackHint: "rageminorant",
    needed: 1,
    reviews: [
      {
        firstImpression: "DECENT" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: false,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "NOT_APPLICABLE" as const,
        highEndQuality: "TOO_DULL" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "TOO_COMPRESSED" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "High-pass everything that doesn't need to exist below 80Hz — even a rough pass on the supporting elements will immediately open up the low end.",
        biggestWeaknessSpecific:
          "The low-mids are sitting heavy — there's a build-up roughly in the 200–350Hz range that's making the mix feel thick rather than powerful. It's the kind of thing that sounds okay in headphones but gets congested the moment you play it on a proper system. The high end also isn't cutting through the way it should at volume — a bit more presence around 4–5kHz and some air above 10k would give it that sharpness when it hits louder.",
        bestPart:
          "The aggression and energy are genuinely there — it hits with intent and the rhythmic structure is tight. The layering of the main elements shows good instinct for the genre and the track has real momentum to it.",
        listenDuration: 174,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
    ],
  },
  {
    ownerEmail: "chanelbaidjoe14@gmail.com",
    trackHint: "scaryyyy",
    needed: 2,
    reviews: [
      {
        firstImpression: "DECENT" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: false,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "SLIGHTLY_BURIED" as const,
        highEndQuality: "TOO_DULL" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "ACCEPTABLE" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "A/B your low end against a reference track in the same genre — you'll hear the 200Hz congestion immediately on comparison.",
        biggestWeaknessSpecific:
          "There's a low-mid build-up that's muddying things — the mix feels fuller than it should be in a way that works against clarity rather than for warmth. On a decent speaker system it accumulates quickly and the bottom end loses definition. The top end is also sitting a bit back; it doesn't carry through the way it should at volume, which makes the mix feel slightly flat when played loud. Some cuts in the 200–300Hz range and a gentle lift above 10kHz would change things significantly.",
        bestPart:
          "The vibe and direction are clear and there's genuine feeling in the performance. The core of the track works well and the arrangement has a good sense of space — it knows when to pull back and when to push. With a cleaner mix this is close.",
        listenDuration: 191,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
      {
        firstImpression: "STRONG_HOOK" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: true,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "CRYSTAL_CLEAR" as const,
        highEndQuality: "ACCEPTABLE" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "ACCEPTABLE" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "Try comparing it on a mono speaker — the low-mid congestion will jump out more clearly there and make it easier to find what needs cutting.",
        biggestWeaknessSpecific:
          "The low end is a bit full — not in a controlled, powerful way, more in a way that's clouding everything underneath. The kick and bass aren't sitting cleanly next to each other and on a proper system the bottom end feels thick rather than tight. Some targeted cuts around 180–280Hz would free up a lot of space and make the mix feel immediately more professional.",
        bestPart:
          "The hook is genuinely strong — it's the kind of thing that sticks after one listen, which is a harder thing to pull off than most people realise. The vocal sits well above the production and the emotional delivery comes through clearly.",
        listenDuration: 208,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
    ],
  },
  {
    ownerEmail: "romeo.juank@gmail.com",
    trackHint: "things i never said",
    needed: 1,
    reviews: [
      {
        firstImpression: "STRONG_HOOK" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: true,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "SLIGHTLY_BURIED" as const,
        highEndQuality: "TOO_DULL" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "ACCEPTABLE" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "Pull the vocal up slightly in the chorus — there's a lot of emotional weight in the delivery that's getting slightly swallowed by the production underneath.",
        biggestWeaknessSpecific:
          "The low-mids are accumulating in the fuller sections and muddying the overall picture. Ballads especially suffer from this because the warmth that sounds intentional on headphones tends to feel heavy and congested on speakers. The high end also needs some more air — it comes across a little dull through a system, like the top of the mix has been slightly rolled off. Letting some more presence through in the 5kHz range and some air above 10k would make it feel more open and emotional without losing warmth.",
        bestPart:
          "The emotional core of the track is there and it comes through from the first listen. The performance is honest and the lyrical moments land — that section around the two-thirds mark is particularly effective, it has real weight to it.",
        listenDuration: 224,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
    ],
  },
  {
    ownerEmail: "gleb.demonist@gmail.com",
    trackHint: "1802",
    needed: 2,
    reviews: [
      {
        firstImpression: "DECENT" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: false,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "NOT_APPLICABLE" as const,
        highEndQuality: "TOO_DULL" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "TOO_COMPRESSED" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "Try playing it on a Bluetooth speaker or a phone — the low-mid congestion becomes obvious there and it'll point you straight to what needs cutting.",
        biggestWeaknessSpecific:
          "There's accumulated weight in the low-mids that's holding the mix back — around 200–350Hz things are getting thick and the kick and bass aren't sitting cleanly. On headphones it passes but on a system it stacks up and the bottom end loses punch. The top end is also sitting back further than it should — the mix doesn't carry its presence through at volume the way it could. A couple of surgical cuts low-mid and a brighter top shelf would make this feel much more finished.",
        bestPart:
          "The atmosphere and concept are strong — the track has a distinct identity and the sound design choices feel deliberate. There's a real sense of space in the arrangement and the progression holds interest throughout.",
        listenDuration: 196,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
      {
        firstImpression: "DECENT" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: true,
        wouldShare: false,
        wouldFollow: false,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "NOT_APPLICABLE" as const,
        highEndQuality: "ACCEPTABLE" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "ACCEPTABLE" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "High-pass the pads and textural elements aggressively — anything below 100Hz that isn't bass or kick is probably just adding mud at this point.",
        biggestWeaknessSpecific:
          "The low-mids are congested — the mix is carrying too much energy in the 200–300Hz range and it's making everything feel heavy and indistinct. The individual elements that should have definition in the low end are blurring together instead of sitting cleanly. This is the kind of thing that translates fine on softer listening setups but falls apart on a bigger system. Cleaning that region up is the single biggest lever you've got right now.",
        bestPart:
          "The track has genuine atmosphere — the mood is consistent and the arrangement carries you through without ever losing the thread. The sound palette is interesting and feels considered, which is harder to pull off than it sounds.",
        listenDuration: 183,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
    ],
  },
  {
    ownerEmail: "anxymusic.anxy@gmail.com",
    trackHint: "tracks on my mind",
    needed: 2,
    reviews: [
      {
        firstImpression: "STRONG_HOOK" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: true,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "SLIGHTLY_BURIED" as const,
        highEndQuality: "TOO_DULL" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "ACCEPTABLE" as const,
        tooRepetitive: false,
        trackLength: "PERFECT" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "Automate the vocal level up slightly in the fuller sections — it's getting nudged out of the way by the production when things get busier.",
        biggestWeaknessSpecific:
          "The low-mids are sitting heavier than they should — there's a build-up in the 200–300Hz range that makes the mix feel congested when it fills out. On earbuds you get away with it but on a proper system it accumulates and starts to cloud the low end. The high end also isn't quite carrying through at volume — the top of the mix feels slightly pulled back which takes away some of that air and presence you'd want for this kind of track. A bit of a cut low-mid and a gentle shelf up in the highs would shift the balance significantly.",
        bestPart:
          "The concept works well across the runtime and there's a clear artistic thread holding it together. The track has personality — the sounds feel chosen rather than defaulted to, and the mix of moods across the volume keeps it interesting without feeling scattered.",
        listenDuration: 231,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
      {
        firstImpression: "DECENT" as const,
        wouldListenAgain: true,
        wouldAddToPlaylist: true,
        wouldShare: false,
        wouldFollow: true,
        lowEndClarity: "BOTH_MUDDY" as const,
        vocalClarity: "CRYSTAL_CLEAR" as const,
        highEndQuality: "ACCEPTABLE" as const,
        stereoWidth: "GOOD_BALANCE" as const,
        dynamics: "ACCEPTABLE" as const,
        tooRepetitive: false,
        trackLength: "BIT_LONG" as const,
        playlistAction: "LET_PLAY" as const,
        qualityLevel: "ALMOST_THERE" as const,
        nextFocus: "MIXING" as const,
        quickWin:
          "High-pass the pads and background elements hard — anything below 100Hz that isn't the core bass or kick is likely adding to the mud without adding anything useful.",
        biggestWeaknessSpecific:
          "The low-mid area needs work — there's accumulated thickness that's making the overall mix feel heavier than intended. It's one of those things that sounds like warmth until you play it on a system and realise it's actually congestion. The individual tracks in that region are competing for space and as a result the low end as a whole loses clarity and punch. Cleaning out the low-mids on supporting elements would give the main elements a lot more room.",
        bestPart:
          "The energy is right and the transitions between the tracks feel considered rather than arbitrary. There's a consistent aesthetic running through the whole thing which makes it feel like a proper body of work rather than a collection of loose ideas thrown together.",
        listenDuration: 248,
        paidAmount: 0,
        isPeerReview: true,
        status: "COMPLETED" as const,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 2,
      },
    ],
  },
];

type ReviewTemplate = (typeof TARGETS)[0]["reviews"][0];

async function main() {
  const seedReviewers = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, User: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
    skip: 10,
  });

  if (seedReviewers.length < 5) {
    console.error("Not enough seed reviewers found.");
    process.exit(1);
  }

  let reviewerIdx = 20; // offset to use a different slice than other scripts

  for (const target of TARGETS) {
    const user = await prisma.user.findUnique({
      where: { email: target.ownerEmail },
      select: {
        ArtistProfile: {
          select: {
            id: true,
            Track: {
              where: { packageType: "PEER", status: { in: ["QUEUED", "IN_PROGRESS", "UPLOADED"] } },
              select: { id: true, title: true, reviewsRequested: true, reviewsCompleted: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    const profile = user?.ArtistProfile;
    if (!profile) {
      console.log(`✗ No artist profile for ${target.ownerEmail}`);
      continue;
    }

    const track = target.trackHint
      ? profile.Track.find((t) => t.title.toLowerCase().includes(target.trackHint!)) ??
        profile.Track[0]
      : profile.Track[0];

    if (!track) {
      console.log(`✗ No active track found for ${target.ownerEmail}`);
      continue;
    }

    console.log(`\n▶ "${track.title}" (${target.ownerEmail})`);
    console.log(`  ${track.reviewsCompleted}/${track.reviewsRequested} reviews`);

    for (let i = 0; i < target.reviews.length; i++) {
      const template = target.reviews[i];

      // Find a reviewer who hasn't reviewed this track yet
      let reviewer = null;
      for (let attempt = 0; attempt < seedReviewers.length; attempt++) {
        const candidate = seedReviewers[(reviewerIdx + attempt) % seedReviewers.length];
        if (candidate.id === profile.id) continue;

        const already = await prisma.review.findFirst({
          where: { trackId: track.id, peerReviewerArtistId: candidate.id },
          select: { id: true },
        });
        if (!already) {
          reviewer = candidate;
          reviewerIdx += attempt + 1;
          break;
        }
      }

      if (!reviewer) {
        console.log(`  ⚠ No available reviewer for review ${i + 1}, skipping`);
        continue;
      }

      const hoursAgo = (target.reviews.length - i) * 4 + Math.random() * 3;
      const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.review.create({
          data: {
            trackId: track.id,
            peerReviewerArtistId: reviewer!.id,
            createdAt,
            updatedAt: new Date(createdAt.getTime() + 240000 + Math.random() * 480000),
            ...template,
          },
        });

        const newCompleted = track.reviewsCompleted + i + 1;
        const isNowDone = newCompleted >= track.reviewsRequested;

        await tx.track.update({
          where: { id: track.id },
          data: {
            reviewsCompleted: { increment: 1 },
            status: isNowDone ? "COMPLETED" : "IN_PROGRESS",
            completedAt: isNowDone ? new Date() : null,
          },
        });

        await tx.reviewQueue.deleteMany({
          where: { trackId: track.id, artistReviewerId: reviewer!.id },
        });
      });

      console.log(`  ✓ Review ${i + 1}/${target.reviews.length} from ${reviewer.User.email}`);
    }
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
