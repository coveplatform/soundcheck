import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT t.id, t.title, t.status, t."reviewsCompleted", t."reviewsRequested", t."createdAt"
    FROM "Track" t
    JOIN "ArtistProfile" ap ON ap.id = t."artistId"
    JOIN "User" u ON u.id = ap."userId"
    WHERE u.email = 'sashasmart@gmail.com'
    ORDER BY t."createdAt" DESC
  `;

  if (rows.length === 0) { console.log("No tracks found for sashasmart@gmail.com"); return; }

  for (const t of rows) {
    console.log(`\n${t.title}`);
    console.log(`  id: ${t.id}`);
    console.log(`  status: ${t.status}  (${t.reviewsCompleted}/${t.reviewsRequested})`);
    console.log(`  created: ${t.createdAt}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
