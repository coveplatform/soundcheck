import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

async function main() {
  const ARTIST_ID = "cmkxkq40j000004ihelwulaha"; // ppepon788@gmail.com

  // Find active reviews that have stale/expired queue entries
  const activeReviews = await prisma.review.findMany({
    where: {
      peerReviewerArtistId: ARTIST_ID,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    include: {
      Track: {
        select: { title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
      },
    },
  });

  console.log(`Found ${activeReviews.length} active review(s) for ppepon788@gmail.com:\n`);
  for (const r of activeReviews) {
    console.log(`  [${r.status}] "${r.Track.title}" (track: ${r.Track.status}, ${r.Track.reviewsCompleted}/${r.Track.reviewsRequested})`);
    console.log(`    listenDuration: ${r.listenDuration}s, lastHeartbeat: ${r.lastHeartbeat}`);
  }

  const newExpiresAt = new Date();
  newExpiresAt.setHours(newExpiresAt.getHours() + 48);

  let fixed = 0;
  for (const review of activeReviews) {
    const existingQueue = await prisma.reviewQueue.findFirst({
      where: { trackId: review.trackId, artistReviewerId: ARTIST_ID },
    });

    if (existingQueue) {
      // Extend expiry
      await prisma.reviewQueue.update({
        where: { id: existingQueue.id },
        data: { expiresAt: newExpiresAt },
      });
      console.log(`\n✓ Extended expiry for "${review.Track.title}" → ${newExpiresAt.toISOString()}`);
    } else {
      // Queue entry was already deleted — recreate it
      await prisma.$transaction(async (tx) => {
        await tx.reviewQueue.create({
          data: {
            trackId: review.trackId,
            artistReviewerId: ARTIST_ID,
            expiresAt: newExpiresAt,
            priority: 0,
          },
        });
        // Also ensure review is IN_PROGRESS
        await tx.review.update({
          where: { id: review.id },
          data: { status: "IN_PROGRESS" },
        });
      });
      console.log(`\n✓ Recreated queue entry for "${review.Track.title}" → ${newExpiresAt.toISOString()}`);
    }
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed} review(s). ppepon788 now has until ${newExpiresAt.toISOString()} to submit.`);
  console.log("\nNote: they still need to listen for 3+ minutes on each review page before submitting.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
