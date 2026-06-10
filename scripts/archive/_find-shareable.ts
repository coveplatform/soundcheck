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
  const reviews = await prisma.review.findMany({
    where: {
      bestPart: { not: null },
      OR: [{ productionScore: { gte: 4 } }, { firstImpression: "STRONG_HOOK" }],
    },
    take: 5,
    select: {
      id: true,
      bestPart: true,
      productionScore: true,
      firstImpression: true,
      Track: { select: { title: true, trackShareId: true } },
    },
  });
  console.log(JSON.stringify(reviews, null, 2));
}

main().finally(() => prisma.$disconnect());
