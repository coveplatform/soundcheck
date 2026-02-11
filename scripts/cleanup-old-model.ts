import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Cleaning up old model data ===\n");

  // 1. Delete any remaining ASSIGNED peer reviews that weren't cleaned up
  const assignedPeer = await prisma.review.deleteMany({
    where: { isPeerReview: true, status: "ASSIGNED" },
  });
  console.log(`1. Deleted ${assignedPeer.count} stale ASSIGNED peer reviews`);

  // 2. Delete orphaned ReviewQueue entries (no matching active review)
  const orphanedQueues = await prisma.reviewQueue.deleteMany({
    where: {
      artistReviewerId: { not: null },
      Track: {
        Review: {
          none: {
            isPeerReview: true,
            status: { in: ["IN_PROGRESS", "COMPLETED"] },
          },
        },
      },
    },
  });
  console.log(`2. Deleted ${orphanedQueues.count} orphaned peer ReviewQueue entries`);

  // 3. Delete expired ReviewQueue entries (legacy)
  const expiredQueues = await prisma.reviewQueue.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`3. Deleted ${expiredQueues.count} expired ReviewQueue entries`);

  // 4. Delete EXPIRED and SKIPPED reviews older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldTerminal = await prisma.review.deleteMany({
    where: {
      status: { in: ["EXPIRED", "SKIPPED"] },
      updatedAt: { lt: thirtyDaysAgo },
    },
  });
  console.log(`4. Deleted ${oldTerminal.count} old EXPIRED/SKIPPED reviews (>30 days)`);

  // 5. Summary of what remains
  const [totalReviews, totalQueues, totalTracks] = await Promise.all([
    prisma.review.count(),
    prisma.reviewQueue.count(),
    prisma.track.count({ where: { packageType: "PEER", status: { in: ["QUEUED", "IN_PROGRESS"] } } }),
  ]);

  console.log(`\n=== Current State ===`);
  console.log(`Total reviews: ${totalReviews}`);
  console.log(`Total queue entries: ${totalQueues}`);
  console.log(`Available PEER tracks: ${totalTracks}`);

  await prisma.$disconnect();
}
main();
