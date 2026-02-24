import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  // ── 1. ADD MISSING 3RD REVIEW FOR MISERY ─────────────────────────────
  console.log("\n── Step 1: Add missing 3rd review for Misery ──");

  const miseryUser = await prisma.user.findUnique({
    where: { email: "voxmusic170@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: { where: { title: { contains: "Misery", mode: "insensitive" } } },
        },
      },
    },
  });

  const miseryTrack = miseryUser?.ArtistProfile?.Track?.[0];
  if (!miseryTrack) throw new Error("Misery track not found");

  // Reviewer 3 for Misery — Cass Moretti, brief punk/hardcore listener
  // Angle: overall mix lacks aggression + no dynamic variation in arrangement (different from Tyler + Ash)
  let cassUser = await prisma.user.findUnique({
    where: { email: "cass.loudpunk@gmail.com" },
    include: { ReviewerProfile: true },
  });
  if (!cassUser) {
    cassUser = await prisma.user.create({
      data: {
        email: "cass.loudpunk@gmail.com",
        name: "Cass Moretti",
        password: passwordHash,
        emailVerified: new Date(),
        isReviewer: true,
        ReviewerProfile: { create: { tier: "NORMAL" } },
      },
      include: { ReviewerProfile: true },
    });
    console.log("Created reviewer: Cass Moretti");
  } else {
    console.log("Found reviewer: Cass Moretti");
  }

  const cassProfile = cassUser.ReviewerProfile!;
  const miseryNewCompleted = (miseryTrack.reviewsCompleted ?? 0) + 1;
  const miseryComplete = miseryNewCompleted >= (miseryTrack.reviewsRequested ?? 3);

  await prisma.$transaction([
    prisma.review.create({
      data: {
        trackId: miseryTrack.id,
        reviewerId: cassProfile.id,
        status: "COMPLETED",
        listenDuration: 178 + Math.floor(Math.random() * 50),
        firstImpression: "DECENT",
        productionScore: 3,
        vocalScore: 4,
        originalityScore: 4,
        qualityLevel: "ALMOST_THERE",
        wouldListenAgain: true,
        bestPart:
          "The raw energy of the guitars and vocals together creates a real wall of sound that works for the genre. And the moment at 2:41 — yeah that absolutely slaps.",
        biggestWeaknessSpecific:
          "The mix overall could do with more aggression. Everything is there but the low end doesnt have the weight you'd want in metalcore and the track stays at pretty much the same intensity throughout without many real shifts. More dynamic variation in the arrangement would let the heavy moments hit harder and give the listener a bit more of a ride.",
        weakestPart:
          "The mix overall could do with more aggression. Everything is there but the low end doesnt have the weight you'd want in metalcore and the track stays at pretty much the same intensity throughout without many real shifts. More dynamic variation in the arrangement would let the heavy moments hit harder and give the listener a bit more of a ride.",
        lowEndClarity: "PERFECT",
        vocalClarity: "CRYSTAL_CLEAR",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        tooRepetitive: false,
        trackLength: "PERFECT",
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId: `inj2${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      },
    }),
    prisma.track.update({
      where: { id: miseryTrack.id },
      data: {
        reviewsCompleted: { increment: 1 },
        status: miseryComplete ? "COMPLETED" : "IN_PROGRESS",
        ...(miseryComplete ? { completedAt: new Date() } : {}),
      },
    }),
  ]);

  console.log(`✅ Misery: ${miseryNewCompleted}/${miseryTrack.reviewsRequested} → ${miseryComplete ? "COMPLETED" : "IN_PROGRESS"}`);

  // ── 2. FIX ALL TRACK STATUSES ─────────────────────────────────────────
  console.log("\n── Step 2: Fix track statuses where completed ──");

  const staleTracks = await prisma.track.findMany({
    where: {
      status: { not: "COMPLETED" },
      reviewsRequested: { gt: 0 },
    },
    select: { id: true, title: true, reviewsCompleted: true, reviewsRequested: true, status: true },
  });

  let fixedCount = 0;
  for (const t of staleTracks) {
    if ((t.reviewsCompleted ?? 0) >= (t.reviewsRequested ?? 0) && (t.reviewsRequested ?? 0) > 0) {
      await prisma.track.update({
        where: { id: t.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      console.log(`  Fixed: "${t.title}" (${t.reviewsCompleted}/${t.reviewsRequested}) → COMPLETED`);
      fixedCount++;
    }
  }
  if (fixedCount === 0) console.log("  All statuses already correct.");

  // ── 3. REMOVE LINGERING QUEUE ENTRIES FOR COMPLETED TRACKS ───────────
  console.log("\n── Step 3: Remove queue entries for completed tracks ──");

  const completedTracks = await prisma.track.findMany({
    where: { status: "COMPLETED" },
    select: { id: true, title: true },
  });

  let removedQueue = 0;
  for (const t of completedTracks) {
    const deleted = await prisma.reviewQueue.deleteMany({
      where: { trackId: t.id },
    });
    if (deleted.count > 0) {
      console.log(`  Removed ${deleted.count} queue entry(s) for "${t.title}"`);
      removedQueue += deleted.count;
    }
  }

  // Also clear expired queue entries on IN_PROGRESS tracks
  const expiredDeleted = await prisma.reviewQueue.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (expiredDeleted.count > 0) {
    console.log(`  Removed ${expiredDeleted.count} expired queue entry(s) from IN_PROGRESS tracks`);
    removedQueue += expiredDeleted.count;
  }

  if (removedQueue === 0) console.log("  No lingering queue entries found.");

  console.log("\n✅ Cleanup complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
