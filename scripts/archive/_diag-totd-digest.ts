import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  // 1. Most recent featured chart submissions
  const featured = await (prisma as any).chartSubmission.findMany({
    where: { isFeatured: true },
    orderBy: { chartDate: "desc" },
    take: 8,
    select: { id: true, title: true, chartDate: true, editorNote: true, editorNoteGeneratedAt: true, voteCount: true },
  });
  console.log(`\n=== Featured ChartSubmissions (most recent ${featured.length}) ===`);
  for (const f of featured) {
    const note = f.editorNote ? `note:${f.editorNote.length}ch` : "NO EDITOR NOTE";
    console.log(`  ${new Date(f.chartDate).toISOString().slice(0, 10)}  "${f.title}"  votes:${f.voteCount}  ${note}`);
  }
  if (featured.length === 0) console.log("  (none — /today will show EmptyState, no TOTD email ever)");

  // 2. Reviews that count toward analytics, last 7 days (chart-finalize input)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const analyticReviews = await (prisma as any).review.count({
    where: { status: "COMPLETED", countsTowardAnalytics: true, updatedAt: { gte: sevenDaysAgo } },
  });
  console.log(`\n=== chart-finalize input ===`);
  console.log(`  COMPLETED + countsTowardAnalytics reviews in last 7d: ${analyticReviews}`);

  // 3. The owner's profile (weekly-digest eligibility)
  const owner = await (prisma as any).user.findUnique({
    where: { email: "kris.engelhardt4@gmail.com" },
    select: {
      email: true,
      ArtistProfile: {
        select: { completedOnboarding: true, subscriptionStatus: true, updatedAt: true, genrePreferences: true },
      },
    },
  });
  console.log(`\n=== Owner weekly-digest eligibility (kris.engelhardt4@gmail.com) ===`);
  if (!owner?.ArtistProfile) {
    console.log("  no ArtistProfile");
  } else {
    const p = owner.ArtistProfile;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    console.log(`  completedOnboarding: ${p.completedOnboarding}`);
    console.log(`  subscriptionStatus: ${p.subscriptionStatus}  (weekly digest SKIPS if "active")`);
    console.log(`  profile.updatedAt: ${new Date(p.updatedAt).toISOString()}  (must be >= ${thirtyDaysAgo.toISOString().slice(0,10)})`);
    console.log(`  active within 30d: ${new Date(p.updatedAt) >= thirtyDaysAgo}`);
  }

  // 4. Is CRON_SECRET set locally? (only indicative — prod is what matters)
  console.log(`\n=== Env ===`);
  console.log(`  CRON_SECRET present in this env: ${Boolean(process.env.CRON_SECRET)}`);
  console.log(`  ANTHROPIC/AI key present: ${Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
