import { prisma } from "../src/lib/prisma";

// Replacement artwork URLs (verified working Unsplash images)
const replacements: Record<string, string> = {
  "Burning Chrome": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Crystal Caves": "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Dead Weight": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Paper Chase": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Underwater Stars": "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=400&h=400&fit=crop&crop=entropy&auto=format",
  "Wrecking Ball": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop&crop=entropy&auto=format",
};

async function main() {
  console.log("=== Fixing broken seed track artwork ===\n");

  for (const [title, newUrl] of Object.entries(replacements)) {
    // Verify the new URL works
    try {
      const res = await fetch(newUrl, { method: "HEAD" });
      if (!res.ok) {
        console.log(`⚠️ Replacement URL also broken for "${title}" (HTTP ${res.status}), skipping`);
        continue;
      }
    } catch (e) {
      console.log(`⚠️ Replacement URL fetch failed for "${title}", skipping`);
      continue;
    }

    const updated = await prisma.track.updateMany({
      where: {
        title,
        ArtistProfile: {
          User: { email: { endsWith: "@seed.mixreflect.com" } },
        },
      },
      data: { artworkUrl: newUrl },
    });

    console.log(`✅ "${title}" → updated ${updated.count} track(s)`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
