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
        { email: { contains: "riku", mode: "insensitive" } },
        { email: { contains: "korkimaki", mode: "insensitive" } },
        { trackTitle: { contains: "riku", mode: "insensitive" } },
        { notes: { contains: "korkimaki", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${reports.length} report(s)\n`);
  for (const r of reports) {
    const rq = r.reviewerQuotes as any;
    console.log("================================================");
    console.log("id:           ", r.id);
    console.log("slug:         ", r.slug);
    console.log("email:        ", r.email);
    console.log("trackTitle:   ", r.trackTitle);
    console.log("trackUrl:     ", r.trackUrl);
    console.log("genre:        ", r.genre);
    console.log("notes:        ", r.notes);
    console.log("status:       ", r.status);
    console.log("score:        ", r.score);
    console.log("percentile:   ", r.percentile);
    console.log("verdict:      ", r.verdict);
    console.log("cat scores:   ", {
      hook: r.hookScore, prod: r.productionScore, ret: r.retentionScore,
      emo: r.emotionalScore, comm: r.commercialScore,
    });
    console.log("grounded:     ", rq?.grounded);
    console.log("summaryHead:  ", rq?.headline);
    console.log("createdAt:    ", r.createdAt);
    console.log("completedAt:  ", r.completedAt);
    console.log("aiSummary:    ", r.aiSummary?.slice(0, 200));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
