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
  const reports = await prisma.trackScoreReport.findMany({
    where: {
      OR: [
        { email: "legendaryknightsoul@gmail.com" },
        { trackTitle: { contains: "scottsville", mode: "insensitive" } },
      ],
    },
    include: {
      ScoreReview: {
        select: { id: true, reviewerId: true, status: true, rating: true, assignedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  console.log("=== Score reports for legendaryknightsoul / scottsville ===");
  console.log(JSON.stringify(reports, null, 2));

  // Is Kris a score reviewer? + any ScoreReview assigned to Kris
  const kris = await prisma.user.findFirst({
    where: { email: "kris.engelhardt4@gmail.com" },
    select: { id: true, isScoreReviewer: true, isReviewer: true },
  });
  console.log("\n=== Kris flags ===", JSON.stringify(kris));
}

main().catch(console.error).finally(() => prisma.$disconnect());
