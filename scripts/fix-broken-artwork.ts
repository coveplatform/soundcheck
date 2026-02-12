/**
 * Fix the 6 broken Unsplash artwork URLs on seed tracks.
 * Usage: npx tsx scripts/fix-broken-artwork.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const fixes: Record<string, string> = {
  "Supernova in Dm": "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Rainfall Tape": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Paper Chase": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Burning Chrome": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Dead Weight": "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Wrecking Ball": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop&crop=entropy&auto=format",
};

async function main() {
  console.log("=== Fixing broken seed track artwork ===\n");

  for (const [title, newUrl] of Object.entries(fixes)) {
    const updated = await prisma.track.updateMany({
      where: {
        title,
        ArtistProfile: {
          User: { email: { endsWith: "@seed.mixreflect.com" } },
        },
      },
      data: { artworkUrl: newUrl },
    });

    console.log(`  ✅ "${title}" → updated ${updated.count} track(s)`);
  }

  console.log("\nDone! Verifying...\n");

  // Verify all are now accessible
  const tracks = await prisma.track.findMany({
    where: {
      title: { in: Object.keys(fixes) },
      ArtistProfile: {
        User: { email: { endsWith: "@seed.mixreflect.com" } },
      },
    },
    select: { title: true, artworkUrl: true },
  });

  for (const t of tracks) {
    if (!t.artworkUrl) { console.log(`  ❌ "${t.title}" has no URL`); continue; }
    const r = await fetch(t.artworkUrl, { method: "HEAD" });
    console.log(`  ${r.ok ? "✅" : "❌"} "${t.title}" → HTTP ${r.status}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
