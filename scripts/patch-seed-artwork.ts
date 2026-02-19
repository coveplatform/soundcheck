/**
 * patch-seed-artwork.ts
 *
 * Assigns artwork URLs to seed tracks that have none.
 * Uses picsum.photos with the track ID as a seed for consistent images.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/patch-seed-artwork.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      artworkUrl: null,
      ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    },
    select: { id: true, title: true },
  });

  console.log(`Found ${tracks.length} seed tracks with no artwork\n`);

  for (const track of tracks) {
    // picsum.photos/seed/{seed}/400/400 gives a consistent image per seed
    const artworkUrl = `https://picsum.photos/seed/${track.id}/400/400`;

    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });

    console.log(`  ✓ "${track.title}" → ${artworkUrl}`);
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
