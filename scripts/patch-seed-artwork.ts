/**
 * patch-seed-artwork.ts
 *
 * Assigns local activity-artwork images to seed tracks.
 * Images served from /public/activity-artwork/{n}.jpg
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/patch-seed-artwork.ts
 */

import { prisma } from "../src/lib/prisma";

const TOTAL_IMAGES = 34;

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Updating artwork for ${tracks.length} seed tracks...\n`);

  // Shuffle image numbers so the spread feels random rather than sequential
  const imageNums = Array.from({ length: TOTAL_IMAGES }, (_, i) => i + 1);
  // Simple deterministic shuffle (Fisher-Yates with a fixed seed)
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  for (let i = imageNums.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [imageNums[i], imageNums[j]] = [imageNums[j], imageNums[i]];
  }

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const num = imageNums[i % TOTAL_IMAGES];
    const artworkUrl = `/activity-artwork/${num}.jpg`;

    process.stdout.write(`  [${i + 1}/${tracks.length}] "${track.title}" → ${artworkUrl}... `);

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
