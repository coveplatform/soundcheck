import { prisma } from "../src/lib/prisma";

// Curated Unsplash photo IDs grouped by genre - all music/abstract/mood themed
// Format: https://images.unsplash.com/photo-{id}?w=400&h=400&fit=crop&crop=entropy
const ARTWORK: Record<string, string[]> = {
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
    "photo-1459749411175-04bf5292ceea", // concert stage
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
  ],
  other: [
    "photo-1507838153414-b4b713384a76", // piano keys
    "photo-1511192336575-5a79af67a629", // acoustic guitar
    "photo-1446057032654-9d8885db76c6", // sunset landscape
    "photo-1459749411175-04bf5292ceea", // warm concert lights
  ],
};

function getArtworkUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&crop=entropy&auto=format`;
}

function detectGenre(slugs: string[]): string {
  const s = new Set(slugs);
  if (s.has("electronic") || s.has("house") || s.has("techno") || s.has("edm") || s.has("synthwave") || s.has("deep-house")) return "electronic";
  if (s.has("hip-hop-rnb") || s.has("hip-hop") || s.has("trap") || s.has("rnb") || s.has("boom-bap")) return "hiphop";
  if (s.has("rock-metal") || s.has("rock") || s.has("metal") || s.has("punk") || s.has("alternative")) return "rock";
  return "other";
}

async function main() {
  const seedTracks = await prisma.track.findMany({
    where: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      Genre: { select: { slug: true } },
    },
  });

  console.log(`Found ${seedTracks.length} seed tracks\n`);

  const usedPerGenre: Record<string, number> = { electronic: 0, hiphop: 0, rock: 0, other: 0 };

  for (const track of seedTracks) {
    const slugs = track.Genre.map((g) => g.slug);
    const genre = detectGenre(slugs);
    const pool = ARTWORK[genre];
    const idx = usedPerGenre[genre] % pool.length;
    usedPerGenre[genre]++;

    const artworkUrl = getArtworkUrl(pool[idx]);

    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });

    console.log(`  ${track.title} (${genre}) → ${pool[idx].slice(0, 30)}...`);
  }

  console.log(`\nDone! Updated ${seedTracks.length} tracks with artwork.`);
  await prisma.$disconnect();
}
main();
