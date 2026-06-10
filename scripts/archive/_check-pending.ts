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
  // All IN_PROGRESS tracks — show full picture
  const tracks = await prisma.$queryRaw<any[]>`
    SELECT t.id, t.title, t."reviewsCompleted", t."reviewsRequested", t.status, u.email as "artistEmail"
    FROM "Track" t
    JOIN "ArtistProfile" ap ON ap.id = t."artistId"
    JOIN "User" u ON u.id = ap."userId"
    WHERE t.status = 'IN_PROGRESS'
    ORDER BY (t."reviewsRequested" - t."reviewsCompleted") ASC, t."createdAt" DESC
  `;

  console.log(`\n=== All IN_PROGRESS tracks (${tracks.length} total) ===\n`);
  for (const t of tracks) {
    const needed = t.reviewsRequested - t.reviewsCompleted;
    console.log(`[needs ${needed}] ${t.title} (${t.reviewsCompleted}/${t.reviewsRequested}) — ${t.artistEmail}`);
    console.log(`         id: ${t.id}`);
  }

  // Also check for tracks with status != IN_PROGRESS but 0 reviews completed and 1+ requested
  const stalled = await prisma.$queryRaw<any[]>`
    SELECT t.id, t.title, t."reviewsCompleted", t."reviewsRequested", t.status, u.email as "artistEmail"
    FROM "Track" t
    JOIN "ArtistProfile" ap ON ap.id = t."artistId"
    JOIN "User" u ON u.id = ap."userId"
    WHERE t.status NOT IN ('IN_PROGRESS', 'COMPLETED')
      AND t."reviewsRequested" > 0
    ORDER BY t."createdAt" DESC
    LIMIT 20
  `;

  if (stalled.length > 0) {
    console.log(`\n=== Non-IN_PROGRESS tracks with requests (${stalled.length}) ===\n`);
    for (const t of stalled) {
      console.log(`[${t.status}] ${t.title} (${t.reviewsCompleted}/${t.reviewsRequested}) — ${t.artistEmail}`);
      console.log(`         id: ${t.id}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
