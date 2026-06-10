import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const tracks = await prisma.$queryRaw<any[]>`
    SELECT t.id, t.title, t."reviewsCompleted", t."reviewsRequested", u.email as "artistEmail"
    FROM "Track" t
    JOIN "ArtistProfile" ap ON ap.id = t."artistId"
    JOIN "User" u ON u.id = ap."userId"
    WHERE t.status = 'IN_PROGRESS'
      AND (t."reviewsRequested" - t."reviewsCompleted") = 1
    ORDER BY t."createdAt" DESC
  `;

  console.log(`\n${tracks.length} IN_PROGRESS track(s) with exactly 1 review remaining:\n`);
  for (const t of tracks) {
    console.log(`  "${t.title}" (${t.reviewsCompleted}/${t.reviewsRequested}) — ${t.artistEmail}`);
    console.log(`    id: ${t.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
