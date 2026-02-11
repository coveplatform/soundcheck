import { prisma } from "../src/lib/prisma";

async function main() {
  const tracks = await prisma.track.findMany({
    where: { packageType: "PEER", status: { in: ["QUEUED", "IN_PROGRESS"] } },
    select: {
      id: true,
      title: true,
      reviewsRequested: true,
      artistId: true,
      _count: {
        select: {
          Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } },
        },
      },
    },
  });

  let available = 0;
  let full = 0;
  for (const t of tracks) {
    if (t._count.Review >= t.reviewsRequested) full++;
    else available++;
  }

  console.log(`Total PEER tracks: ${tracks.length}`);
  console.log(`Still need reviews: ${available}`);
  console.log(`Already full: ${full}`);
  console.log(`reviewsRequested values: ${JSON.stringify([...new Set(tracks.map((t) => t.reviewsRequested))])}`);

  // Show a few full ones
  const fullTracks = tracks.filter((t) => t._count.Review >= t.reviewsRequested).slice(0, 5);
  console.log(`\nSample full tracks:`);
  for (const t of fullTracks) {
    console.log(`  "${t.title}" - requested: ${t.reviewsRequested}, active reviews: ${t._count.Review}`);
  }

  // Show available ones
  const avail = tracks.filter((t) => t._count.Review < t.reviewsRequested);
  console.log(`\nAvailable tracks:`);
  for (const t of avail) {
    console.log(`  "${t.title}" - requested: ${t.reviewsRequested}, active reviews: ${t._count.Review}`);
  }

  await prisma.$disconnect();
}
main();
