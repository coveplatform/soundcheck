import { prisma } from "../src/lib/prisma";

// More realistic/casual artist names by genre
const NAMES: Record<string, string[]> = {
  electronic: [
    "synthwave_kid", "lofi.alex", "bassface99", "niteshift_", "echoplug",
    "deepgroove.wav", "beatmode", "subfreq_", "pulsewrk", "driftcircuit",
  ],
  hiphop: [
    "beatsdude23", "yungtape", "prodbykai_", "808sonly", "trapchef",
    "flowstate.mp3", "lilboombox", "rhymecraft", "snaregang", "vinyldig",
  ],
  pop: [
    "melodymakers", "sparkle.wav", "indiekid_", "dreampop.hq", "softglow",
    "moonphase_", "neonlights", "coastaldream", "shimmer.mp3", "popcraft",
  ],
  rock: [
    "fuzzpedal", "riffhound", "ampstack_", "overdrive.wav", "shredzone",
    "powerchord99", "grungekid", "distortion_", "heavyhitter", "stompbox",
  ],
  other: [
    "soulcraft.wav", "jazzhands_", "folkways", "groovebox", "acousticnerve",
    "vinylsoul", "worldsound_", "funkdept", "chillcraft", "ambientmood",
  ],
};

function detectGenre(slugs: string[]): string {
  const s = new Set(slugs);
  if (s.has("electronic") || s.has("house") || s.has("techno") || s.has("edm")) return "electronic";
  if (s.has("hip-hop-rnb") || s.has("hip-hop") || s.has("trap") || s.has("rnb")) return "hiphop";
  if (s.has("pop-dance") || s.has("pop") || s.has("indie-pop")) return "pop";
  if (s.has("rock-metal") || s.has("rock") || s.has("metal")) return "rock";
  return "other";
}

async function main() {
  const seedArtists = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: {
      id: true,
      artistName: true,
      User: { select: { email: true } },
      Track: {
        select: { Genre: { select: { slug: true } } },
        take: 1,
      },
    },
  });

  console.log(`Updating ${seedArtists.length} seed artist names...\n`);

  const usedNames = new Set<string>();

  for (const artist of seedArtists) {
    const slugs = artist.Track[0]?.Genre.map((g) => g.slug) ?? [];
    const genre = detectGenre(slugs);
    const pool = NAMES[genre] ?? NAMES.other;

    // Pick a name that hasn't been used yet
    let newName = pool.find((n) => !usedNames.has(n));
    if (!newName) {
      // If pool exhausted, add a number suffix
      newName = pool[Math.floor(Math.random() * pool.length)] + Math.floor(Math.random() * 99);
    }
    usedNames.add(newName);

    await prisma.artistProfile.update({
      where: { id: artist.id },
      data: { artistName: newName },
    });
    console.log(`  ${artist.artistName} → ${newName} (${genre})`);
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}
main();
