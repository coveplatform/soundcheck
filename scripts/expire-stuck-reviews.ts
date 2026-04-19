import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("No DATABASE_URL found");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const EMAILS = [
  "a.heber@gmx.de",
  "ppepon788@gmail.com",
];

async function main() {
  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (!user) {
      console.log(`[SKIP] No user found for ${email}`);
      continue;
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      console.log(`[SKIP] No artist profile for ${email}`);
      continue;
    }

    const activeReviews = await prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
      select: { id: true, trackId: true, status: true },
    });

    if (activeReviews.length === 0) {
      console.log(`[OK] No active reviews for ${email}`);
      continue;
    }

    console.log(`[INFO] Found ${activeReviews.length} active review(s) for ${email}`);

    for (const review of activeReviews) {
      await prisma.$transaction(async (tx) => {
        // Expire the review
        await tx.review.update({
          where: { id: review.id },
          data: { status: "EXPIRED" },
        });

        // Remove from ReviewQueue
        await tx.reviewQueue.deleteMany({
          where: {
            trackId: review.trackId,
            artistReviewerId: artistProfile.id,
          },
        });

        // Check if track should go back to QUEUED
        const remaining = await tx.review.count({
          where: {
            trackId: review.trackId,
            status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
          },
        });

        if (remaining === 0) {
          await tx.track.update({
            where: { id: review.trackId },
            data: { status: "QUEUED" },
          });
          console.log(`  → Track ${review.trackId} reset to QUEUED`);
        } else {
          console.log(`  → Track ${review.trackId} still has ${remaining} other review(s), left as-is`);
        }

        console.log(`  → Review ${review.id} expired for ${email}`);
      });
    }
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
