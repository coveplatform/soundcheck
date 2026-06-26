import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // Find every track titled "Untitled" (case-insensitive).
  const tracks = await prisma.track.findMany({
    where: { title: { equals: "Untitled", mode: "insensitive" } },
    select: {
      id: true,
      title: true,
      status: true,
      reviewsRequested: true,
      reviewsCompleted: true,
      createdAt: true,
      ArtistProfile: { select: { User: { select: { email: true } } } },
    },
  });

  if (tracks.length === 0) {
    console.log('No track titled "Untitled" found.');
    await prisma.$disconnect();
    return;
  }

  for (const t of tracks) {
    // Distinct people who reviewed this track = number of Review rows
    // (schema enforces one review per reviewer per track).
    const totalReviews = await prisma.review.count({ where: { trackId: t.id } });
    const completedReviews = await prisma.review.count({
      where: { trackId: t.id, status: "COMPLETED" },
    });

    console.log("----------------------------------------");
    console.log(`Title:             ${t.title}`);
    console.log(`Track ID:          ${t.id}`);
    console.log(`Artist:            ${t.ArtistProfile?.User?.email ?? "unknown"}`);
    console.log(`Status:            ${t.status}`);
    console.log(`Created:           ${t.createdAt.toISOString()}`);
    console.log(`Reviews requested: ${t.reviewsRequested}`);
    console.log(`reviewsCompleted:  ${t.reviewsCompleted} (denormalized counter)`);
    console.log(`Review rows:       ${totalReviews} total, ${completedReviews} completed`);
  }
  console.log("----------------------------------------");

  await prisma.$disconnect();
}

main().catch(console.error);
