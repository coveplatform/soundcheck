/**
 * patch-seed-artwork.ts
 *
 * Updates seed track artwork using DiceBear's shapes API.
 * Each track gets a unique abstract geometric image seeded by its ID.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/patch-seed-artwork.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
      status: { in: ["QUEUED", "IN_PROGRESS", "COMPLETED"] },
    },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Updating artwork for ${tracks.length} seed tracks...\n`);

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    process.stdout.write(`  [${i + 1}/${tracks.length}] "${track.title}"... `);

    // DiceBear shapes: unique abstract geometric art per track ID
    const artworkUrl = `https://api.dicebear.com/9.x/shapes/png?seed=${encodeURIComponent(track.id)}&size=400`;

    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });

    console.log("✓");
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
