import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL is not defined (set DATABASE_URL or POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING/POSTGRES_URL)"
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const genres = [
  // Parent categories (broad genres)
  { name: "Electronic", slug: "electronic" },
  { name: "Hip-Hop & R&B", slug: "hip-hop-rnb" },
  { name: "Rock & Metal", slug: "rock-metal" },
  { name: "Pop", slug: "pop-dance" },
  { name: "Jazz & Soul", slug: "jazz-soul" },
  { name: "Other", slug: "other" },

  // Electronic sub-genres
  { name: "House", slug: "house" },
  { name: "Deep House", slug: "deep-house" },
  { name: "Tech House", slug: "tech-house" },
  { name: "Progressive House", slug: "progressive-house" },
  { name: "Techno", slug: "techno" },
  { name: "Hard Techno", slug: "hard-techno" },
  { name: "Minimal", slug: "minimal" },
  { name: "Drum & Bass", slug: "drum-and-bass" },
  { name: "Jungle", slug: "jungle" },
  { name: "Breaks", slug: "breaks" },
  { name: "UK Garage", slug: "uk-garage" },
  { name: "Speed Garage", slug: "speed-garage" },
  { name: "Dubstep", slug: "dubstep" },
  { name: "Trance", slug: "trance" },
  { name: "Hardstyle", slug: "hardstyle" },
  { name: "Hardcore", slug: "hardcore-electronic" },
  { name: "Ambient", slug: "ambient" },
  { name: "Downtempo", slug: "downtempo" },
  { name: "IDM", slug: "idm" },
  { name: "EDM", slug: "edm" },
  { name: "Synthwave", slug: "synthwave" },
  { name: "Lo-Fi", slug: "lo-fi" },
  { name: "Future Bass", slug: "future-bass" },
  { name: "Electronica", slug: "electronica" },

  // Hip-Hop & R&B sub-genres
  { name: "Hip-Hop", slug: "hip-hop" },
  { name: "Trap", slug: "trap" },
  { name: "R&B", slug: "rnb" },
  { name: "Boom Bap", slug: "boom-bap" },
  { name: "Drill", slug: "drill" },
  { name: "UK Rap", slug: "uk-rap" },
  { name: "Grime", slug: "grime" },
  { name: "Phonk", slug: "phonk" },
  { name: "Cloud Rap", slug: "cloud-rap" },
  { name: "Lo-Fi Hip-Hop", slug: "lo-fi-hip-hop" },
  { name: "Old School Hip-Hop", slug: "old-school-hip-hop" },
  { name: "Conscious Hip-Hop", slug: "conscious-hip-hop" },
  { name: "Neo-Soul", slug: "neo-soul" },

  // Rock & Metal sub-genres
  { name: "Rock", slug: "rock" },
  { name: "Indie Rock", slug: "indie-rock" },
  { name: "Alternative", slug: "alternative" },
  { name: "Grunge", slug: "grunge" },
  { name: "Hard Rock", slug: "hard-rock" },
  { name: "Prog Rock", slug: "prog-rock" },
  { name: "Post-Rock", slug: "post-rock" },
  { name: "Post-Punk", slug: "post-punk" },
  { name: "Emo", slug: "emo" },
  { name: "Punk", slug: "punk" },
  { name: "Pop Punk", slug: "pop-punk" },
  { name: "Metal", slug: "metal" },
  { name: "Metalcore", slug: "metalcore" },
  { name: "Death Metal", slug: "death-metal" },
  { name: "Black Metal", slug: "black-metal" },
  { name: "Thrash Metal", slug: "thrash-metal" },
  { name: "Nu Metal", slug: "nu-metal" },
  { name: "Hardcore Punk", slug: "hardcore-punk" },

  // Pop sub-genres
  { name: "Pop", slug: "pop" },
  { name: "Indie Pop", slug: "indie-pop" },
  { name: "Electropop", slug: "electropop" },
  { name: "Synth Pop", slug: "synth-pop" },
  { name: "Hyperpop", slug: "hyperpop" },
  { name: "Dream Pop", slug: "dream-pop" },
  { name: "Bedroom Pop", slug: "bedroom-pop" },
  { name: "Art Pop", slug: "art-pop" },
  { name: "Dance Pop", slug: "dance-pop" },
  { name: "K-Pop", slug: "k-pop" },

  // Jazz & Soul sub-genres
  { name: "Jazz", slug: "jazz" },
  { name: "Soul", slug: "soul" },
  { name: "Funk", slug: "funk" },
  { name: "Blues", slug: "blues" },
  { name: "Gospel", slug: "gospel" },
  { name: "Smooth Jazz", slug: "smooth-jazz" },
  { name: "Jazz Fusion", slug: "jazz-fusion" },
  { name: "Bossa Nova", slug: "bossa-nova" },

  // Other genres
  { name: "Reggae", slug: "reggae" },
  { name: "Dancehall", slug: "dancehall" },
  { name: "Afrobeats", slug: "afrobeats" },
  { name: "Latin", slug: "latin" },
  { name: "Country", slug: "country" },
  { name: "Folk", slug: "folk" },
  { name: "Acoustic", slug: "acoustic" },
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
