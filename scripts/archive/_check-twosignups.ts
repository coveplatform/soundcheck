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

const EMAILS = ["6sixxprod@gmail.com", "phoenixsmithjr555@gmail.com"];

async function main() {
  for (const email of EMAILS) {
    const reports = await prisma.trackScoreReport.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      include: { ScoreReview: true },
    });

    console.log(`\n================ ${email} ================`);
    console.log(`  reports: ${reports.length}`);
    for (const r of reports) {
      console.log(`\n  --- REPORT ${r.slug} ---`);
      console.log(`    status:        ${r.status}`);
      console.log(`    trackTitle:    ${r.trackTitle}`);
      console.log(`    trackUrl:      ${r.trackUrl}`);
      console.log(`    genre:         ${r.genre}`);
      console.log(`    notes:         ${r.notes}`);
      console.log(`    createdAt:     ${r.createdAt?.toISOString?.()}`);
      console.log(`    paidAt:        ${r.paidAt?.toISOString?.() ?? "(not paid)"}`);
      console.log(`    completedAt:   ${r.completedAt?.toISOString?.() ?? "(not completed)"}`);
      console.log(`    claimedAt:     ${r.claimedAt?.toISOString?.() ?? "(unclaimed)"}`);
      console.log(`    createdByIp:   ${r.createdByIp}`);
      console.log(`    artistId:      ${r.artistId ?? "(none)"}`);
      console.log(`    --- SCORES ---`);
      console.log(`    score:         ${r.score}  percentile: ${r.percentile}  verdict: ${r.verdict}`);
      console.log(`    hook:          ${r.hookScore}`);
      console.log(`    production:    ${r.productionScore}`);
      console.log(`    retention:     ${r.retentionScore}`);
      console.log(`    emotional:     ${r.emotionalScore}`);
      console.log(`    commercial:    ${r.commercialScore}`);
      console.log(`    aiSummary:     ${r.aiSummary ?? "(none)"}`);
      console.log(`    priorityFixes: ${JSON.stringify(r.priorityFixes)}`);
      console.log(`    reviewerQuotes:${JSON.stringify(r.reviewerQuotes)}`);
      console.log(`    humanRoom:     requested=${r.humanReviewsRequested} skipped=${r.humanRoomSkipped}`);
      console.log(`    ScoreReviews:  ${r.ScoreReview.length}`);
      for (const sr of r.ScoreReview) {
        console.log(`      - status=${sr.status} rating=${sr.rating} reviewerId=${sr.reviewerId ?? "(unassigned)"}`);
        console.log(`        headline: ${sr.headline ?? "(none)"}`);
        console.log(`        quote:    ${sr.quote ?? "(none)"}`);
      }
    }
  }

  // Also catch reports created from same IP around the same time (correlation)
  console.log(`\n\n================ Recent reports (last 2h, any email) ================`);
  const recent = await prisma.trackScoreReport.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 2 * 3600 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { email: true, slug: true, status: true, trackTitle: true, createdByIp: true, createdAt: true, score: true },
  });
  for (const r of recent) {
    console.log(`  ${r.createdAt?.toISOString?.()}  ip=${r.createdByIp}  ${r.email}  [${r.status}] score=${r.score}  "${r.trackTitle}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
