import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "therealmrenoch@gmail.com" },
    select: { id: true },
  });
  if (!user) { console.log("User not found"); return; }

  const allTracks = await prisma.track.findMany({
    where: { ArtistProfile: { userId: user.id } },
    select: { id: true, title: true, status: true, reviewsRequested: true, creditsSpent: true, createdAt: true },
  });

  console.log("All tracks by therealmrenoch@gmail.com:");
  console.log(JSON.stringify(allTracks, null, 2));
  console.log(`Total tracks: ${allTracks.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
