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

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

type Tier = "A" | "B";

function makeReview(tier: Tier, hasVocals: boolean, bestPart: string, mainFeedback: string) {
  const high = tier === "A";
  return {
    firstImpression: high ? ("STRONG_HOOK" as const) : ("DECENT" as const),
    productionScore: high ? 4 : 3,
    vocalScore: hasVocals ? 4 : null,
    originalityScore: high ? 5 : 3,
    wouldListenAgain: true,
    qualityLevel: high ? ("RELEASE_READY" as const) : ("ALMOST_THERE" as const),
    vocalClarity: hasVocals ? ("CRYSTAL_CLEAR" as const) : ("NOT_APPLICABLE" as const),
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    playlistAction: high ? ("ADD_TO_LIBRARY" as const) : ("LET_PLAY" as const),
    nextFocus: "ARRANGEMENT" as const,
    bestPart,
    biggestWeaknessSpecific: mainFeedback,
  };
}

type Job = {
  trackId: string;
  artistEmail: string;
  trackTitle: string;
  reviews: ReturnType<typeof makeReview>[];
};

const JOBS: Job[] = [
  {
    trackId: "cmq0tbfai000004jvsr2d6t8q",
    artistEmail: "kmullis66@gmail.com",
    trackTitle: "Opiated Redeaux (the Tragically Hip reenvisionment)",
    reviews: [
      makeReview("A", true,
        "Honestly I really enjoyed this. Theres a kind of weird nostalgic feeling to it that I wasnt expecting and it pulled me right in. Felt warm and familiar.",
        "If anything I just wish it was a bit longer. Right when I was settling into the world youd built it kind of wrapped up. I think theres room to stretch some of these sections out and let them breath a little more. Would happily sit in it longer."),
      makeReview("B", true,
        "Theres somthing really comforting about the sound here. Kinda strange in a good way and it took me back without me knowing why. Enjoyed the whole vibe a lot.",
        "My one thing is it ends sooner than I wanted. The mood is so nice that another section or even just a longer outro would let it land deeper. Felt like it was just getting going when it finished. Talented though!"),
    ],
  },
  {
    trackId: "cmppde37b0002ccvi20ym2n1i",
    artistEmail: "djstonez@gmail.com",
    trackTitle: "Cool On Purpose (1)",
    reviews: [
      makeReview("A", true,
        "I'm really into this. The sound has this kinda weird nostalgic edge that feels different from most stuff I hear and it honestly stuck with me after.",
        "Main thing for me is I wish it ran a little longer. Just as I was locking into the groove it was over. A bit more time in that pocket or an extra section would make it hit harder. Really enjoyable as is though."),
      makeReview("B", true,
        "This has a cool faded retro feel that I didnt expect and I genuinely enjoyed sitting with it. Theres a charm to how slightly off it feels in places.",
        "Only note is the length. It felt a touch short for how good the mood is, I wanted to live in it longer. Maybe extend the back half a bit. Other than that I think your onto somthing here."),
    ],
  },
  {
    trackId: "cmpg40whm000004l8kv7wvgcu",
    artistEmail: "oliverlardner@gmail.com",
    trackTitle: "𝔐𝔞𝔡𝔢𝔩𝔢𝔦𝔫𝔢 𝔇𝔯𝔢𝔞𝔪𝔷",
    reviews: [
      makeReview("A", false,
        "Theres a dreamy nostalgic quality to this that I really enjoyed. It feels kinda weird and hazy in the best way, like a half remembered memory you cant place.",
        "If I had to pick somthing, I just wish it was a little longer. It builds such a nice atmosphere and then its gone. Letting it develop for another minute would really pay off. Lovely sound though."),
      makeReview("B", false,
        "Really enjoyed the mood on this one. Got that slightly strange nostalgic warmth that pulls you in and keeps you floating along the whole way through.",
        "My only thing is the runtime. Its so immersive that ending where it does left me wanting more, I'd happily sit in it twice as long. Think about stretching the middle out a bit. Beautiful work."),
    ],
  },
  {
    trackId: "cmps2wk0s000c04jvvn555j5p",
    artistEmail: "oliverlardner@gmail.com",
    trackTitle: "SOFT DELETE",
    reviews: [
      makeReview("A", false,
        "I'm really enjoying the sound world here. Theres a weird nostalgic glow to it that feels both retro and new at the same time, which is really cool.",
        "Honestly my main feedback is I wish there was more of it. The textures are great but it wraps just as it gets interesting. Another section would let the idea breathe properly. Wanted to stay in it longer."),
      makeReview("B", false,
        "This has such a nice faded, kinda glitchy nostalgic feel and I enjoyed every second. It pulls you into its own little world really quickly which I loved.",
        "The one thing for me is length, it felt short for how rich the atmosphere is. I think you could double the runtime and I'd still be locked in. Let some moments repeat and evolve. Great stuff."),
    ],
  },
  {
    trackId: "cmppdedxg0008ccviweklo7gc",
    artistEmail: "lucidwavs@gmail.com",
    trackTitle: "Midnight Arcade (1)",
    reviews: [
      makeReview("A", false,
        "Really fun and I enjoyed it a lot. The sound has this kinda weird retro arcade nostalgia that took me right back, super charming and warm all the way through.",
        "My main note is just that I wish it was longer. It sets up such a great mood then ends before it fully delivers on it. Another section or two would make it really memorable. Loved the vibe though."),
      makeReview("B", false,
        "Theres somthing really nostalgic and slightly strange about this that I genuinely loved. Felt like a memory I couldnt quite place, in a good way honestly.",
        "Only thing is the length for me. Just as I got pulled in it was done. I'd love to hear this stretched out with more variation so the world has time to grow. Really enjoyable start."),
    ],
  },
  {
    trackId: "cmpsgh8xi000304kzdteja4dt",
    artistEmail: "kentoraptor@gmail.com",
    trackTitle: "Spirited Away - The Dragon Boy (Remix) by Enzo",
    reviews: [
      makeReview("A", false,
        "I really enjoyed this. The remix has a lovely weird nostalgic feel and the melodies carry so much emotion, it genuinely moved me a little bit.",
        "If anything I wish it was a touch longer. The mood is gorgeous but it resolves before I was ready for it to. Letting it build for another section would make it land even harder. Beautiful sound."),
      makeReview("B", false,
        "Theres a dreamy nostalgic warmth running through this that I loved. It feels familiar and a little strange at once, which kept me hooked the whole way.",
        "My one thing is the length. Its so immersive that ending where it does left me wanting more. I think theres room to extend the back half and really let it soar. Talented!"),
    ],
  },
  {
    trackId: "cmonieux5000304juqks9zw7o",
    artistEmail: "yousign71@gmail.com",
    trackTitle: "Performing in the u.s.a",
    reviews: [
      makeReview("A", true,
        "Enjoyed this a lot. Theres a kinda weird nostalgic energy to the whole thing that feels really genuine and pulled me in straight away from the start.",
        "Main thing for me is I wish it was a bit longer. Felt like it was just hitting its stride when it ended. A bit more room to develop would really help it land. Good energy though."),
      makeReview("B", true,
        "This has a warm faded nostalgic quality that I really liked, somthing about it feels honest and a little off in a charming way. Enjoyed the ride a lot.",
        "Only note is the runtime, it felt short for how much I was getting into it. I wanted to sit with it longer, maybe extend a section in the middle. Other than that really nice work."),
    ],
  },
  {
    trackId: "cmq2um83y000004kyorvmano4",
    artistEmail: "farhandahir41@gmail.com",
    trackTitle: "orange peel",
    reviews: [
      makeReview("A", false,
        "Really enjoyed this, theres a sweet kinda weird nostalgic feel to it that I wasnt expecting. Felt warm and a little hazy, really easy to get lost in.",
        "My one bit of feedback is I wish it was a little longer. It creates such a nice mood and then its over. Another section to let it grow would be lovely. Wanted more honestly!"),
      makeReview("B", false,
        "Theres somthing really lovely and nostalgic about the sound here. Slightly strange in a way I liked and it kept me floating along the whole time. Enjoyed it.",
        "Only thing for me is the length. It felt short for how nice the atmosphere is, I'd happily listen to twice as much. Think about stretching it out a bit. Talented!"),
    ],
  },
];

async function main() {
  const seeds = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, artistName: true, User: { select: { email: true } } },
    orderBy: { User: { email: "asc" } },
  });

  const usedThisRun = new Set<string>();

  for (const job of JOBS) {
    const track = await prisma.track.findUnique({
      where: { id: job.trackId },
      select: { reviewsCompleted: true, reviewsRequested: true, status: true },
    });
    if (!track) {
      console.error(`[SKIP] track not found: ${job.trackTitle}`);
      continue;
    }

    const existing = await prisma.review.findMany({
      where: { trackId: job.trackId, peerReviewerArtistId: { not: null } },
      select: { peerReviewerArtistId: true },
    });
    const blocked = new Set(existing.map((e) => e.peerReviewerArtistId));

    let completed = track.reviewsCompleted;
    for (const review of job.reviews) {
      const seed = seeds.find((s) => !blocked.has(s.id) && !usedThisRun.has(s.id));
      if (!seed) {
        console.error(`[SKIP] no free seed for ${job.trackTitle}`);
        break;
      }
      usedThisRun.add(seed.id);
      blocked.add(seed.id);

      completed += 1;
      const isNowComplete = completed >= track.reviewsRequested;
      const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
      const listenDuration = 120 + Math.floor(Math.random() * 180);

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

      console.log(`[OK] ${seed.artistName} → "${job.trackTitle}" ${completed}/${track.reviewsRequested} ${isNowComplete ? "✓ COMPLETED" : ""}`);
    }

    try {
      await sendReviewProgressEmail(job.artistEmail, job.trackTitle, completed, track.reviewsRequested);
      console.log(`[EMAIL] → ${job.artistEmail} (${completed}/${track.reviewsRequested})`);
    } catch (e) {
      console.error(`[EMAIL ERR] ${job.artistEmail}`, e);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
