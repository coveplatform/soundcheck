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

type Job = {
  trackId: string;
  artistEmail: string;
  trackTitle: string;
  hasVocals: boolean;
  high: boolean;
  nextFocus: "MIXING" | "ARRANGEMENT" | "SOUND_DESIGN" | "SONGWRITING" | "PERFORMANCE" | "READY_TO_RELEASE";
  bestPart: string;
  mainFeedback: string;
};

const JOBS: Job[] = [
  {
    trackId: "cmq2vbnrt000304l2tj6pnr2l",
    artistEmail: "a3716628@gmail.com",
    trackTitle: "June 7, 2026",
    hasVocals: true,
    high: false,
    nextFocus: "ARRANGEMENT",
    bestPart:
      "The hook landed for me almost straight away. Theres a real confidence in how this opens and it sets a tone that carries through the whole track.",
    mainFeedback:
      "For me the main thing is the middle section dips in energy a bit. You start strong but then theres a stretch where it kind of coasts before picking back up. Tightening that part or adding a small lift would keep the momentum you build early on. Close to somthing really good here.",
  },
  {
    trackId: "cmq294gax000304l5vuiz0xhe",
    artistEmail: "currystud@gmail.com",
    trackTitle: "Saucy! Dropping June 12 www.rogerkmusic.com",
    hasVocals: true,
    high: true,
    nextFocus: "SONGWRITING",
    bestPart:
      "This has so much personality! The energy is infectious and your delivery has a swagger to it that genuinely makes you want to move. Really fun to listen to.",
    mainFeedback:
      "Basically my one note is the back half feels a little flat compared to the start. The intro and first verse hit hard but then the arc kind of levels off instead of climbing to a bigger moment. A proper peak near the end would make it really stick. You've got a great voice though.",
  },
  {
    trackId: "cmq1smurj000204l5eg2fukbd",
    artistEmail: "timvolts@protonmail.com",
    trackTitle: "Don't Stop by Tim Volts",
    hasVocals: true,
    high: false,
    nextFocus: "ARRANGEMENT",
    bestPart:
      "Theres a really solid groove holding this together... it just feels good to ride along with. The whole thing has a steady momentum that I enjoyed a lot.",
    mainFeedback:
      "My main thing is the dynamics stay pretty even the whole way through. It locks into a nice pocket but never really pulls back or surges, so it can blur together a bit by the end. Even one section where you strip things down then build back would give it more shape. Talented!",
  },
];

async function main() {
  const seeds = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, artistName: true },
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

    const seed = seeds.find((s) => !blocked.has(s.id) && !usedThisRun.has(s.id));
    if (!seed) {
      console.error(`[SKIP] no free seed for ${job.trackTitle}`);
      continue;
    }
    usedThisRun.add(seed.id);

    const completed = track.reviewsCompleted + 1;
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
          firstImpression: job.high ? "STRONG_HOOK" : "DECENT",
          productionScore: job.high ? 4 : 3,
          vocalScore: job.hasVocals ? 4 : null,
          originalityScore: job.high ? 5 : 3,
          wouldListenAgain: true,
          qualityLevel: job.high ? "RELEASE_READY" : "ALMOST_THERE",
          vocalClarity: job.hasVocals ? "CRYSTAL_CLEAR" : "NOT_APPLICABLE",
          lowEndClarity: "PERFECT",
          highEndQuality: "PERFECT",
          stereoWidth: "GOOD_BALANCE",
          dynamics: "GREAT_DYNAMICS",
          trackLength: "PERFECT",
          tooRepetitive: false,
          playlistAction: job.high ? "ADD_TO_LIBRARY" : "LET_PLAY",
          nextFocus: job.nextFocus,
          bestPart: job.bestPart,
          biggestWeaknessSpecific: job.mainFeedback,
          weakestPart: job.mainFeedback,
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
