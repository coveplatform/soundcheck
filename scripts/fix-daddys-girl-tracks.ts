import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Fixing Daddy's Girl tracks (inflated reviewsRequested) ===\n");

  // Find both tracks
  const tracks = await prisma.track.findMany({
    where: { title: "Daddy's Girl" },
    include: {
      ArtistProfile: {
        include: { User: { select: { email: true } } },
      },
      Review: {
        select: { id: true, status: true, reviewerId: true },
      },
      _count: { select: { Review: true } },
    },
  });

  console.log(`Found ${tracks.length} tracks titled "Daddy's Girl"\n`);

  for (const track of tracks) {
    const email = track.ArtistProfile?.User?.email ?? "unknown";
    const completedReviews = track.Review.filter(r => r.status === "COMPLETED").length;
    const activeReviews = track.Review.filter(r => ["ASSIGNED", "IN_PROGRESS"].includes(r.status)).length;

    console.log(`Track ID: ${track.id}`);
    console.log(`  Artist: ${email}`);
    console.log(`  Status: ${track.status}`);
    console.log(`  Current reviewsRequested: ${track.reviewsRequested}`);
    console.log(`  reviewsCompleted: ${track.reviewsCompleted}`);
    console.log(`  Total Review records: ${track._count.Review}`);
    console.log(`  Completed reviews: ${completedReviews}`);
    console.log(`  Active reviews (ASSIGNED/IN_PROGRESS): ${activeReviews}`);
    console.log(`  creditsSpent: ${track.creditsSpent}`);

    // The bug added 5 from STARTER package. Correct reviewsRequested = current - 5
    const correctedReviewsRequested = Math.max(0, (track.reviewsRequested ?? 0) - 5);
    
    console.log(`  Corrected reviewsRequested: ${correctedReviewsRequested}`);

    // Determine new status
    let newStatus = track.status;
    if (correctedReviewsRequested === 0) {
      newStatus = "UPLOADED";
    } else if (completedReviews >= correctedReviewsRequested) {
      newStatus = "COMPLETED";
    }

    console.log(`  New status: ${newStatus}`);

    // Cancel any ASSIGNED reviews beyond the corrected count
    const reviewsToKeep = correctedReviewsRequested - completedReviews;
    const assignedReviews = track.Review.filter(r => r.status === "ASSIGNED");
    const assignedToCancel = assignedReviews.slice(Math.max(0, reviewsToKeep));

    if (assignedToCancel.length > 0) {
      console.log(`  Cancelling ${assignedToCancel.length} excess ASSIGNED reviews`);
      for (const review of assignedToCancel) {
        await prisma.review.update({
          where: { id: review.id },
          data: { status: "EXPIRED" },
        });
        // Remove from queue
        await prisma.reviewQueue.deleteMany({
          where: { trackId: track.id, reviewerId: review.reviewerId },
        });
      }
    }

    // Update the track
    await prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsRequested: correctedReviewsRequested,
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date() : null,
      },
    });

    console.log(`  ✅ Updated\n`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
