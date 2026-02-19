/**
 * patch-seed-artwork.ts
 *
 * Updates seed track artwork with real Unsplash photo URLs.
 * Resolves source.unsplash.com redirects to get stable images.unsplash.com URLs.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/patch-seed-artwork.ts
 */

import { prisma } from "../src/lib/prisma";

// Genre folder keyword map for Unsplash searches
const GENRE_KEYWORDS: Record<string, string[]> = {
  electronic: [
    "electronic music neon",
    "synthesizer dark",
    "techno concert lights",
    "DJ mixing dark",
    "rave neon glow",
    "music studio dark",
    "digital art music",
    "sound waves neon",
    "concert laser lights",
    "electronic producer studio",
    "night club lights",
    "music visualizer dark",
  ],
  hiphop: [
    "hip hop street art",
    "urban graffiti city",
    "rap music microphone",
    "city night skyline",
    "street photography urban",
    "music studio microphone",
    "new york city graffiti",
    "urban culture street",
    "concert hip hop",
  ],
  rock: [
    "electric guitar dark",
    "rock concert stage",
    "guitar amplifier music",
    "rock band concert",
    "music stage performance",
    "guitarist dark moody",
    "concert crowd energy",
    "heavy metal concert",
    "drums music dark",
    "rock music stage lights",
    "guitar solo stage",
    "band performance stage",
  ],
};

async function resolveUnsplashUrl(keywords: string, sig: number): Promise<string | null> {
  const query = encodeURIComponent(keywords);
  const url = `https://source.unsplash.com/400x400/?${query}&sig=${sig}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    // Get the resolved URL (images.unsplash.com/photo-...) and strip size params
    const resolved = res.url;
    if (!resolved.includes("unsplash.com")) return null;
    // Normalise to a clean crop URL
    const base = resolved.split("?")[0];
    return `${base}?w=400&h=400&fit=crop&auto=format`;
  } catch {
    return null;
  }
}

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      title: true,
      Genre: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Updating artwork for ${tracks.length} seed tracks...\n`);

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];

    // Determine genre folder key
    const genreNames = track.Genre.map((g) => g.name.toLowerCase());
    let genreKey = "electronic";
    if (genreNames.some((g) => g.includes("hip") || g.includes("rap") || g.includes("trap"))) {
      genreKey = "hiphop";
    } else if (genreNames.some((g) => g.includes("rock") || g.includes("metal") || g.includes("punk"))) {
      genreKey = "rock";
    }

    const keywords = GENRE_KEYWORDS[genreKey];
    const keyword = keywords[i % keywords.length];

    process.stdout.write(`  [${i + 1}/${tracks.length}] "${track.title}" (${genreKey})... `);

    const artworkUrl = await resolveUnsplashUrl(keyword, i + 1);

    if (!artworkUrl) {
      console.log("failed to resolve, skipping");
      continue;
    }

    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });

    console.log("✓");

    // Be nice to Unsplash — small delay between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
