import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const genres = [
  // Parent categories (broad genres)
  { name: "Electronic", slug: "electronic" },
  { name: "Hip-Hop & R&B", slug: "hip-hop-rnb" },
  { name: "Rock & Metal", slug: "rock-metal" },
  { name: "Pop & Dance", slug: "pop-dance" },
  { name: "Other", slug: "other" },

  // Electronic sub-genres
  { name: "House", slug: "house" },
  { name: "Deep House", slug: "deep-house" },
  { name: "Progressive House", slug: "progressive-house" },
  { name: "Techno", slug: "techno" },
  { name: "Hard Techno", slug: "hard-techno" },
  { name: "Drum & Bass", slug: "drum-and-bass" },
  { name: "Dubstep", slug: "dubstep" },
  { name: "Trance", slug: "trance" },
  { name: "Ambient", slug: "ambient" },
  { name: "EDM", slug: "edm" },
  { name: "Synthwave", slug: "synthwave" },
  { name: "Lo-Fi", slug: "lo-fi" },
  { name: "Future Bass", slug: "future-bass" },

  // Hip-Hop & R&B sub-genres
  { name: "Hip-Hop", slug: "hip-hop" },
  { name: "Trap", slug: "trap" },
  { name: "R&B", slug: "rnb" },
  { name: "Boom Bap", slug: "boom-bap" },
  { name: "Drill", slug: "drill" },

  // Rock & Metal sub-genres
  { name: "Rock", slug: "rock" },
  { name: "Indie Rock", slug: "indie-rock" },
  { name: "Alternative", slug: "alternative" },
  { name: "Metal", slug: "metal" },
  { name: "Punk", slug: "punk" },

  // Pop sub-genres
  { name: "Pop", slug: "pop" },
  { name: "Indie Pop", slug: "indie-pop" },
  { name: "Electropop", slug: "electropop" },
  { name: "Synth Pop", slug: "synth-pop" },

  // Other sub-genres
  { name: "Jazz", slug: "jazz" },
  { name: "Soul", slug: "soul" },
  { name: "Funk", slug: "funk" },
  { name: "Reggae", slug: "reggae" },
  { name: "Country", slug: "country" },
  { name: "Folk", slug: "folk" },
  { name: "Classical", slug: "classical" },
  { name: "World", slug: "world" },
  { name: "Experimental", slug: "experimental" },
  { name: "Singer-Songwriter", slug: "singer-songwriter" },
];

async function main() {
  console.log("Seeding genres...");

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre,
    });
  }

  console.log(`Seeded ${genres.length} genres`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
