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

const ASSIGNED_IDS = [
  "cmptfq75p0000ocvijnabdjnr",
  "cmot9rtxc00060svixuef0qpn",
  "cmot9rqz100000svikdzklp43",
  "cmot9rs3i00020svid6wylgz9",
];

async function main() {
  console.log("=== The 4 currently-assigned reviewers on Scottsville report ===");
  const assigned = await prisma.user.findMany({
    where: { id: { in: ASSIGNED_IDS } },
    select: { id: true, email: true, name: true, isScoreReviewer: true },
  });
  console.log(JSON.stringify(assigned, null, 2));

  console.log("\n=== All isScoreReviewer users (the pool) ===");
  const pool = await prisma.user.findMany({
    where: { isScoreReviewer: true },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`count: ${pool.length}`);
  console.log(JSON.stringify(pool, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
