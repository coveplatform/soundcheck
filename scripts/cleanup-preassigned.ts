import { prisma } from "../src/lib/prisma";

async function main() {
  // Delete all pre-assigned ASSIGNED peer reviews (not yet started)
  // These were created by the old proactive assignment system.
  // With the claim model, users will claim tracks on-demand.

  const deleted = await prisma.review.deleteMany({
    where: {
      isPeerReview: true,
      status: "ASSIGNED",
    },
  });
  console.log(`Deleted ${deleted.count} pre-assigned ASSIGNED peer reviews`);

  // Also delete corresponding ReviewQueue entries for peer reviews
  const queueDeleted = await prisma.reviewQueue.deleteMany({
    where: {
      artistReviewerId: { not: null },
      // Only delete queue entries that don't have a matching active review
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
  console.log(`Deleted ${queueDeleted.count} orphaned ReviewQueue entries`);

  // Reset seed tracks back to QUEUED so they appear in the queue
  const resetTracks = await prisma.track.updateMany({
    where: {
      ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
      status: "IN_PROGRESS",
    },
    data: { status: "QUEUED" },
  });
  console.log(`Reset ${resetTracks.count} seed tracks back to QUEUED`);

  // Verify
  const availableTracks = await prisma.track.count({
    where: {
      packageType: "PEER",
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
  });
  console.log(`\n${availableTracks} PEER tracks now available in the queue for all users`);

  await prisma.$disconnect();
}
main();
