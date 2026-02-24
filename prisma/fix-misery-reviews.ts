import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const TRACK_ID = "cmlzmr3sz000004lhyevt4vse";

// Seeded reviewer emails for this track
const SEEDED_EMAILS = [
  "tyler.heavyriff@gmail.com",
  "ash.metalcraft@gmail.com",
  "cass.loudpunk@gmail.com",
];

async function main() {
  // List all reviews
  const reviews = await prisma.review.findMany({
    where: { trackId: TRACK_ID, status: "COMPLETED" },
    include: {
      ReviewerProfile: {
        include: { User: { select: { email: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${reviews.length} reviews for Misery:\n`);
  for (const r of reviews) {
    const email = r.ReviewerProfile?.User?.email ?? "unknown";
    const isSeeded = SEEDED_EMAILS.includes(email);
    console.log(`  [${r.id}] ${email} — seeded: ${isSeeded} — created: ${r.createdAt.toISOString()}`);
  }

  // Find seeded reviews — pick the last one (Cass, added in cleanup script)
  const seededReviews = reviews.filter((r) =>
    SEEDED_EMAILS.includes(r.ReviewerProfile?.User?.email ?? "")
  );

  if (seededReviews.length === 0) {
    console.log("\nNo seeded reviews found — nothing to remove.");
    await prisma.$disconnect();
    return;
  }

  // Remove the most recently created seeded review
  const toDelete = seededReviews[seededReviews.length - 1];
  console.log(`\nRemoving: [${toDelete.id}] ${toDelete.ReviewerProfile?.User?.email}`);

  await prisma.$transaction([
    prisma.review.delete({ where: { id: toDelete.id } }),
    prisma.track.update({
      where: { id: TRACK_ID },
      data: { reviewsCompleted: { decrement: 1 } },
    }),
  ]);

  // Re-check and fix status
  const remaining = await prisma.review.count({
    where: { trackId: TRACK_ID, status: "COMPLETED" },
  });
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    select: { reviewsRequested: true },
  });
  const isComplete = remaining >= (track?.reviewsRequested ?? 3);

  await prisma.track.update({
    where: { id: TRACK_ID },
    data: {
      reviewsCompleted: remaining,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      ...(isComplete ? {} : { completedAt: null }),
    },
  });

  console.log(`✅ Done. Misery now has ${remaining}/${track?.reviewsRequested} reviews → ${isComplete ? "COMPLETED" : "IN_PROGRESS"}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
