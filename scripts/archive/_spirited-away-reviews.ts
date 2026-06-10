import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const reviews = await prisma.review.findMany({
    where: { trackId: "cmpsgh8xi000304kzdteja4dt", status: "COMPLETED" },
    select: { bestPart: true, biggestWeaknessSpecific: true, weakestPart: true, qualityLevel: true, firstImpression: true },
  });
  console.log(`${reviews.length} completed reviews:\n`);
  for (const [i, r] of reviews.entries()) {
    console.log(`--- Review ${i + 1} ---`);
    console.log(`bestPart: ${r.bestPart}`);
    console.log(`mainFeedback: ${r.biggestWeaknessSpecific ?? r.weakestPart}`);
    console.log(`quality: ${r.qualityLevel} | impression: ${r.firstImpression}`);
    console.log();
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
