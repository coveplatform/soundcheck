import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const reports = await prisma.trackScoreReport.findMany({
    where: { score: { not: null }, status: { in: ["IN_REVIEW", "COMPLETED"] } },
    select: { score: true },
  });
  const scores = reports.map((r) => r.score!).filter((s) => s > 0);
  scores.sort((a, b) => a - b);
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const median = scores[Math.floor(n / 2)];
  const sd = Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / n);

  const hist: Record<number, number> = {};
  for (const s of scores) hist[s] = (hist[s] ?? 0) + 1;

  console.log(`n=${n}  mean=${mean.toFixed(1)}  median=${median}  sd=${sd.toFixed(1)}`);
  console.log(`min=${scores[0]} max=${scores[n - 1]}`);
  // band counts
  const band = (lo: number, hi: number) => scores.filter((s) => s >= lo && s <= hi).length;
  console.log(`bands: <60=${band(0,59)}  60-69=${band(60,69)}  70-79=${band(70,79)}  80-89=${band(80,89)}  90+=${band(90,100)}`);
  console.log("\nexact-score histogram (score: count):");
  for (const k of Object.keys(hist).map(Number).sort((a, b) => a - b)) {
    console.log(`  ${k}: ${"#".repeat(hist[k])} (${hist[k]})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
