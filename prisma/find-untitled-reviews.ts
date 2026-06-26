import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// User id from /admin/users/<id>. Override via: USER_ID=... npx tsx prisma/find-untitled-reviews.ts
const USER_ID = process.env.USER_ID ?? "cmp3fvpum000004l6gmsfcdzu";

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: USER_ID },
    select: { id: true, email: true, name: true, ArtistProfile: { select: { id: true, artistName: true } } },
  });

  if (!user) {
    console.log(`No user found with id ${USER_ID}`);
    await prisma.$disconnect();
    return;
  }

  console.log(`User:   ${user.email} (${user.name ?? "no name"})`);
  console.log(`Artist: ${user.ArtistProfile?.artistName ?? "no artist profile"}`);

  if (!user.ArtistProfile) {
    console.log("This user has no artist profile, so no uploaded tracks.");
    await prisma.$disconnect();
    return;
  }

  // Find this artist's track(s) titled "Untitled" (case-insensitive).
  const tracks = await prisma.track.findMany({
    where: {
      artistId: user.ArtistProfile.id,
      title: { equals: "Untitled", mode: "insensitive" },
    },
    select: {
      id: true,
      title: true,
      status: true,
      reviewsRequested: true,
      reviewsCompleted: true,
      createdAt: true,
    },
  });

  if (tracks.length === 0) {
    console.log('No track titled "Untitled" found for this artist.');
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
