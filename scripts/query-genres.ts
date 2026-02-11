import { prisma } from "../src/lib/prisma";
import { assignReviewersToTrack } from "../src/lib/queue";

async function main() {
  // 1. Clear existing seed track assignments
  const seedTracks = await prisma.track.findMany({
    where: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
    select: { id: true, title: true },
  });
  const seedTrackIds = seedTracks.map((t) => t.id);

  const deletedQueue = await prisma.reviewQueue.deleteMany({ where: { trackId: { in: seedTrackIds } } });
  const deletedReviews = await prisma.review.deleteMany({ where: { trackId: { in: seedTrackIds } } });
  console.log(`Cleared ${deletedQueue.count} queue + ${deletedReviews.count} reviews`);

  // 2. Re-run assignment (now uses null reviewerId for peer reviews)
  console.log(`\nAssigning ${seedTracks.length} tracks...`);
  for (const t of seedTracks) {
    try {
      await assignReviewersToTrack(t.id);
      console.log(`  ✓ ${t.title}`);
    } catch (err: any) {
      console.warn(`  ⚠ ${t.title}: ${err.message}`);
    }
  }

  // 3. Verify assignments
  const krisProfile = await prisma.artistProfile.findFirst({
    where: { User: { email: "kris.engelhardt4@gmail.com" } },
  });
  const simProfile = await prisma.artistProfile.findFirst({
    where: { User: { email: "simlimsd3@gmail.com" } },
  });

  const krisReviews = krisProfile ? await prisma.review.count({
    where: { peerReviewerArtistId: krisProfile.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
  }) : 0;
  const simReviews = simProfile ? await prisma.review.count({
    where: { peerReviewerArtistId: simProfile.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
  }) : 0;

  // Verify reviewerId is null for peer reviews
  const peerWithReviewerId = await prisma.review.count({
    where: { isPeerReview: true, reviewerId: { not: null } },
  });
  const peerWithNullReviewerId = await prisma.review.count({
    where: { isPeerReview: true, reviewerId: null },
  });

  console.log(`\nKris: ${krisReviews} pending reviews`);
  console.log(`Simli: ${simReviews} pending reviews`);
  console.log(`Peer reviews with reviewerId set: ${peerWithReviewerId}`);
  console.log(`Peer reviews with reviewerId null: ${peerWithNullReviewerId}`);

  await prisma.$disconnect();
}
main();
