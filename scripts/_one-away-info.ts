import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const TRACK_IDS = [
  "cmpg40whm000004l8kv7wvgcu",
  "cmpocr52t000004l2gelifj67",
  "cmprmqdvb000004jld6rt44bb",
  "cmppctqla000004lh9tfb3p51",
  "cmppcv71g000304lhsgeuy097",
  "cmprhb2p2000204jr5crkl8gr",
];

async function main() {
  for (const id of TRACK_IDS) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT t.id, t.title, t."reviewsCompleted", t."reviewsRequested", u.email as "artistEmail"
      FROM "Track" t
      JOIN "ArtistProfile" ap ON ap.id = t."artistId"
      JOIN "User" u ON u.id = ap."userId"
      WHERE t.id = ${id}
    `;
    const track = rows[0];
    if (!track) { console.log(`NOT FOUND: ${id}`); continue; }

    const usedSeeds = await prisma.$queryRaw<any[]>`
      SELECT u.email
      FROM "Review" r
      JOIN "ArtistProfile" ap ON ap.id = r."peerReviewerArtistId"
      JOIN "User" u ON u.id = ap."userId"
      WHERE r."trackId" = ${id}
    `;

    console.log(`\n--- ${track.title} ---`);
    console.log(`  id: ${track.id}`);
    console.log(`  progress: ${track.reviewsCompleted}/${track.reviewsRequested}`);
    console.log(`  artist email: ${track.artistEmail}`);
    console.log(`  used seeds (${usedSeeds.length}):`);
    for (const r of usedSeeds) {
      console.log(`    ${r.email}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
