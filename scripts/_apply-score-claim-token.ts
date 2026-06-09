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
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "claimToken" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "createdByIp" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "TrackScoreReport_claimToken_key" ON "TrackScoreReport"("claimToken")`
  );
  console.log("✓ claimToken / claimedAt applied");
}

main().catch(console.error).finally(() => prisma.$disconnect());
