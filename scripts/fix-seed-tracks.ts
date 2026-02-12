/**
 * Fix seed tracks: assign unique artwork (no duplicates) and
 * rename generic-sounding track titles to more creative ones.
 *
 * Usage:  npx tsx scripts/fix-seed-tracks.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// ── Unique artwork per track (no repeats across any genre) ───────────────────
// All verified Unsplash photo IDs — music/abstract/mood themed
const ARTWORK_POOL: Record<string, string[]> = {
  electronic: [
    "photo-1614149162883-504ce4d13909", // neon purple lights
    "photo-1550745165-9bc0b252726f", // colorful LED lights
    "photo-1558618666-fcd25c85f82e", // synth wave gradient
    "photo-1557672172-298e090bd0f1", // abstract purple/blue
    "photo-1534796636912-3b95b3ab5986", // blue abstract waves
    "photo-1518640467707-6811f4a6ab73", // DJ turntable
    "photo-1571330735066-03aaa9429d89", // neon city
    "photo-1506157786151-b8491531f063", // concert lights
    "photo-1549490349-8643362247b5", // abstract gradient
    "photo-1511379938547-c1f69419868d", // music studio
    "photo-1470225620780-dba8ba36b745", // DJ crowd
    "photo-1519608487953-e999c86e7455", // crystal cave blue
    "photo-1470813740244-df37b8c1edcb", // underwater light
    "photo-1504898770365-571dc79bea03", // abstract color swirl
    "photo-1533628635777-112b2239b1c7", // purple bokeh
  ],
  hiphop: [
    "photo-1493225457124-a3eb161ffa5f", // microphone closeup
    "photo-1571609808728-01de6ce3bdc0", // urban graffiti
    "photo-1547355253-ff0740f6e8c1", // headphones on table
    "photo-1526478806334-5fd488fcaabc", // city skyline night
    "photo-1514525253161-7a46d19cd819", // crowd concert
    "photo-1505740420928-5e560c06d30e", // headphones flat lay
    "photo-1487180144351-b8472da7d491", // urban street night
    "photo-1574169208507-84376144848b", // abstract colorful
    "photo-1598387993441-a364f854c3e1", // vinyl record
  ],
  rock: [
    "photo-1510915361894-db8b60106cb1", // electric guitar
    "photo-1498038432885-c6f3f1b912ee", // concert crowd
    "photo-1516280030828-3d0b3c6109ca", // guitar amp
    "photo-1511735111819-9a3f7709049c", // rock concert
    "photo-1415201364774-f6f0bb35f28f", // dark stage
    "photo-1508854710579-5cecc3a9ff17", // drum kit
    "photo-1484876065-3f5010585c88", // guitar strings macro
    "photo-1459305272254-33a7e956d246", // live performance
    "photo-1453738773917-9c3eff1db985", // band on stage
    "photo-1524368535928-5b5e00ddc76b", // audience energy
    "photo-1485579149621-3123dd979885", // dark moody stage
    "photo-1514320291840-2e0a9bf2a9ae", // neon guitar
  ],
};

function artworkUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&crop=entropy&auto=format`;
}

function detectGenre(slugs: string[]): string {
  const s = new Set(slugs);
  if (s.has("electronic") || s.has("house") || s.has("techno") || s.has("edm") || s.has("synthwave") || s.has("deep-house")) return "electronic";
  if (s.has("hip-hop-rnb") || s.has("hip-hop") || s.has("trap") || s.has("rnb") || s.has("boom-bap")) return "hiphop";
  if (s.has("rock-metal") || s.has("rock") || s.has("metal") || s.has("punk") || s.has("alternative")) return "rock";
  return "rock"; // fallback to rock since we have the most there
}

// ── Title renames ────────────────────────────────────────────────────────────
// Only rename the ones that sound too generic / placeholder-ish
const TITLE_RENAMES: Record<string, string> = {
  "Voltage": "Voltage Worship",
  "Supernova": "Supernova in Dm",
  "Aurora": "Aurora, Barely",
  "Wildfire": "Wildfire Season",
  "Ironclad": "Ironclad Tongue",
  "Cold Outside": "It Gets Cold Outside",
  "No Filters": "No Filters Left",
  "Block Party": "Block Party Sermon",
  "Afterglow": "Soft Afterglow",
  "Deep Signal": "Deep Signal (3AM)",
  "Southside Story": "Southside Story Pt. II",
  "Old Souls": "Old Souls Don't Sleep",
  "Neon Drift": "Neon Drift / 東京",
  "Velvet Floor": "Velvet Floor (Club Edit)",
  "Gravel Road": "Gravel Road Home",
  "Desert Thunder": "Desert Thunder (Live)",
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Fixing seed tracks: artwork + titles ===\n");

  const seedTracks = await prisma.track.findMany({
    where: {
      ArtistProfile: {
        User: { email: { endsWith: "@seed.mixreflect.com" } },
      },
    },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      Genre: { select: { slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${seedTracks.length} seed tracks\n`);

  // Track which artwork URLs we've used globally to prevent any cross-genre dupes
  const usedArtwork = new Set<string>();
  const genreIndex: Record<string, number> = { electronic: 0, hiphop: 0, rock: 0 };

  let artworkUpdated = 0;
  let titleUpdated = 0;

  for (const track of seedTracks) {
    const slugs = track.Genre.map((g) => g.slug);
    const genre = detectGenre(slugs);
    const pool = ARTWORK_POOL[genre];

    // Find next unused artwork from this genre's pool
    let photoId: string | null = null;
    const startIdx = genreIndex[genre];
    for (let attempt = 0; attempt < pool.length; attempt++) {
      const idx = (startIdx + attempt) % pool.length;
      const candidate = pool[idx];
      if (!usedArtwork.has(candidate)) {
        photoId = candidate;
        usedArtwork.add(candidate);
        genreIndex[genre] = idx + 1;
        break;
      }
    }

    if (!photoId) {
      console.warn(`  ⚠ No unique artwork left for "${track.title}" (${genre})`);
      continue;
    }

    const newArtworkUrl = artworkUrl(photoId);
    const newTitle = TITLE_RENAMES[track.title] ?? null;

    const updateData: Record<string, string> = { artworkUrl: newArtworkUrl };
    if (newTitle) updateData.title = newTitle;

    await prisma.track.update({
      where: { id: track.id },
      data: updateData,
    });

    const titleNote = newTitle ? ` | renamed → "${newTitle}"` : "";
    console.log(`  ✅ "${track.title}" (${genre})${titleNote}`);

    if (newArtworkUrl !== track.artworkUrl) artworkUpdated++;
    if (newTitle) titleUpdated++;
  }

  // Verify no duplicate artwork
  const allTracks = await prisma.track.findMany({
    where: {
      ArtistProfile: {
        User: { email: { endsWith: "@seed.mixreflect.com" } },
      },
    },
    select: { title: true, artworkUrl: true },
  });

  const artworkCount = new Map<string, string[]>();
  for (const t of allTracks) {
    if (!t.artworkUrl) continue;
    if (!artworkCount.has(t.artworkUrl)) artworkCount.set(t.artworkUrl, []);
    artworkCount.get(t.artworkUrl)!.push(t.title);
  }

  let dupeCount = 0;
  for (const [url, titles] of artworkCount) {
    if (titles.length > 1) {
      dupeCount++;
      console.log(`\n  ⚠ STILL DUPLICATE: ${titles.join(", ")} share ${url.slice(0, 60)}...`);
    }
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Artwork updated: ${artworkUpdated}`);
  console.log(`Titles renamed: ${titleUpdated}`);
  console.log(`Remaining duplicates: ${dupeCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
