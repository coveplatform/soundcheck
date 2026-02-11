import { prisma } from "../src/lib/prisma";

async function main() {
  const tracks = await prisma.track.findMany({
    where: { title: { contains: "Push BACK" } },
    include: {
      ArtistProfile: {
        include: { User: { select: { email: true } } },
      },
      Review: {
        select: { id: true, status: true, reviewerId: true, peerReviewerArtistId: true, createdAt: true },
      },
      _count: { select: { Review: true } },
    },
  });

  for (const track of tracks) {
    const email = track.ArtistProfile?.User?.email ?? "unknown";
    const completedReviews = track.Review.filter(r => r.status === "COMPLETED").length;
    const assignedReviews = track.Review.filter(r => ["ASSIGNED", "IN_PROGRESS"].includes(r.status)).length;
    const expiredReviews = track.Review.filter(r => r.status === "EXPIRED").length;
    const skippedReviews = track.Review.filter(r => r.status === "SKIPPED").length;

    console.log(`Track: "${track.title}"`);
    console.log(`  ID: ${track.id}`);
    console.log(`  Artist: ${email}`);
    console.log(`  Status: ${track.status}`);
    console.log(`  Package: ${track.packageType}`);
    console.log(`  reviewsRequested: ${track.reviewsRequested}`);
    console.log(`  reviewsCompleted: ${track.reviewsCompleted}`);
    console.log(`  creditsSpent: ${track.creditsSpent}`);
    console.log(`  Total Review records: ${track._count.Review}`);
    console.log(`  COMPLETED: ${completedReviews}`);
    console.log(`  ASSIGNED/IN_PROGRESS: ${assignedReviews}`);
    console.log(`  EXPIRED: ${expiredReviews}`);
    console.log(`  SKIPPED: ${skippedReviews}`);
    console.log(`  Created: ${track.createdAt.toISOString()}`);
    console.log();
  }

  // Also check the user's credit history
  if (tracks.length > 0) {
    const artistId = tracks[0].artistId;
    const profile = await prisma.artistProfile.findUnique({
      where: { id: artistId },
      select: {
        reviewCredits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
        totalPeerReviews: true,
      },
    });
    console.log("Artist Profile:");
    console.log(`  reviewCredits: ${profile?.reviewCredits}`);
    console.log(`  totalCreditsEarned: ${profile?.totalCreditsEarned}`);
    console.log(`  totalCreditsSpent: ${profile?.totalCreditsSpent}`);
    console.log(`  totalPeerReviews: ${profile?.totalPeerReviews}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
