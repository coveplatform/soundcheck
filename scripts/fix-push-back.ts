import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Fixing Push BACK - Mr. Enoch track ===\n");

  const trackId = "cmlim10ly000004jp99cqu0sz";

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      ArtistProfile: {
        include: { User: { select: { email: true } } },
      },
      Review: {
        select: { id: true, status: true, reviewerId: true, peerReviewerArtistId: true },
      },
    },
  });

  if (!track) {
    console.log("Track not found!");
    return;
  }

  const completedReviews = track.Review.filter(r => r.status === "COMPLETED").length;
  const assignedReviews = track.Review.filter(r => ["ASSIGNED", "IN_PROGRESS"].includes(r.status));

  console.log(`Track: "${track.title}"`);
  console.log(`  Current reviewsRequested: ${track.reviewsRequested}`);
  console.log(`  creditsSpent: ${track.creditsSpent}`);
  console.log(`  Completed: ${completedReviews}, Assigned: ${assignedReviews.length}`);

  // The exploit added 5 reviewsRequested for free (creditsSpent: 0)
  // Correct reviewsRequested = creditsSpent (0) since no credits were legitimately spent on this track
  // But the user has already had 1 review completed + 1 assigned, so we should keep at least those
  // Set reviewsRequested to match the completed reviews count (1) to be fair
  const correctedReviewsRequested = Math.max(0, track.reviewsRequested - 5);

  console.log(`  Corrected reviewsRequested: ${correctedReviewsRequested}`);

  // Cancel excess assigned reviews
  const reviewsToKeep = Math.max(0, correctedReviewsRequested - completedReviews);
  const assignedToCancel = assignedReviews.slice(reviewsToKeep);

  if (assignedToCancel.length > 0) {
    console.log(`  Cancelling ${assignedToCancel.length} excess assigned reviews`);
    for (const review of assignedToCancel) {
      await prisma.review.update({
        where: { id: review.id },
        data: { status: "EXPIRED" },
      });
      await prisma.reviewQueue.deleteMany({
        where: { trackId: track.id, reviewerId: review.peerReviewerArtistId ?? review.reviewerId ?? undefined },
      });
    }
  }

  // Determine new status
  let newStatus = track.status;
  if (correctedReviewsRequested === 0) {
    newStatus = "UPLOADED";
  } else if (completedReviews >= correctedReviewsRequested) {
    newStatus = "COMPLETED";
  }

  console.log(`  New status: ${newStatus}`);

  await prisma.track.update({
    where: { id: trackId },
    data: {
      reviewsRequested: correctedReviewsRequested,
      status: newStatus,
      completedAt: newStatus === "COMPLETED" ? new Date() : null,
    },
  });

  // Also fix the artist's totalCreditsSpent (they had 5 deducted from profile but 0 on the track)
  // Their credits: earned 3 + 2 starter = 5 total. totalCreditsSpent: 5, reviewCredits: 0
  // Since no credits were legitimately spent on this track, refund the 5 to their profile
  // Actually: the request-reviews call likely failed (not enough credits at submission time)
  // and the user earned credits later. The totalCreditsSpent: 5 might be from a separate flow.
  // To be safe, let's not touch the profile credits — just fix the track.

  console.log(`  ✅ Track updated\n`);

  // Verify
  const updated = await prisma.track.findUnique({
    where: { id: trackId },
    select: { reviewsRequested: true, status: true, reviewsCompleted: true },
  });
  console.log("Verified:", JSON.stringify(updated));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
