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
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      r.id as "reviewId",
      r.status,
      r."createdAt",
      r."updatedAt",
      t.title as "trackTitle",
      t.status as "trackStatus",
      u.email as "reviewerEmail",
      EXTRACT(EPOCH FROM (NOW() - r."updatedAt")) / 3600 AS "hoursStale"
    FROM "Review" r
    JOIN "Track" t ON t.id = r."trackId"
    JOIN "ArtistProfile" ap ON ap.id = r."peerReviewerArtistId"
    JOIN "User" u ON u.id = ap."userId"
    WHERE r.status IN ('ASSIGNED', 'IN_PROGRESS')
      AND r."isPeerReview" = true
    ORDER BY r."updatedAt" ASC
  `;

  if (rows.length === 0) {
    console.log("No active uncompleted reviews.");
    return;
  }

  console.log(`${rows.length} claimed but uncompleted review(s):\n`);
  for (const r of rows) {
    const hours = parseFloat(r.hoursStale).toFixed(1);
    console.log(`  [${r.status}] "${r.trackTitle}" (track: ${r.trackStatus})`);
    console.log(`    reviewer: ${r.reviewerEmail}`);
    console.log(`    stale for: ${hours}h`);
    console.log(`    review id: ${r.reviewId}\n`);
  }

  const byStatus = rows.reduce((acc: any, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log("Summary:", byStatus);

  const over24h = rows.filter(r => parseFloat(r.hoursStale) > 24);
  if (over24h.length > 0) {
    console.log(`\n${over24h.length} review(s) stale for >24h (likely abandoned):`);
    for (const r of over24h) {
      console.log(`  "${r.trackTitle}" — ${r.reviewerEmail} — ${parseFloat(r.hoursStale).toFixed(0)}h`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
