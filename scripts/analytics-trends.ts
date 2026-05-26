import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const reviews = await prisma.review.findMany({
    where: { status: "COMPLETED", countsTowardAnalytics: true },
    select: {
      firstImpression: true,
      qualityLevel: true,
      vocalClarity: true,
      lowEndClarity: true,
      highEndQuality: true,
      stereoWidth: true,
      dynamics: true,
      tooRepetitive: true,
      trackLength: true,
      nextFocus: true,
      playlistAction: true,
      wouldListenAgain: true,
      productionScore: true,
      originalityScore: true,
    },
  });

  const total = reviews.length;
  console.log("Total completed reviews (countsTowardAnalytics):", total);

  const pct = (n: number) => ((n / total) * 100).toFixed(1) + "%";

  // First impression
  const fi: Record<string, number> = {};
  reviews.forEach(r => { if (r.firstImpression) fi[r.firstImpression] = (fi[r.firstImpression] || 0) + 1; });
  console.log("\n--- First Impression ---");
  Object.entries(fi).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} (${pct(v)})`));

  // Quality level
  const ql: Record<string, number> = {};
  reviews.forEach(r => { if (r.qualityLevel) ql[r.qualityLevel] = (ql[r.qualityLevel] || 0) + 1; });
  console.log("\n--- Quality Level ---");
  Object.entries(ql).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} (${pct(v)})`));

  // Too repetitive
  const rep = reviews.filter(r => r.tooRepetitive === true).length;
  console.log(`\n--- Too Repetitive ---\n  YES: ${rep} (${pct(rep)})`);

  // Vocal clarity (excluding NOT_APPLICABLE)
  const vcReviews = reviews.filter(r => r.vocalClarity && r.vocalClarity !== "NOT_APPLICABLE");
  const vcBuried = vcReviews.filter(r => r.vocalClarity === "BURIED").length;
  console.log(`\n--- Vocal Clarity (excl. instrumentals, n=${vcReviews.length}) ---`);
  console.log(`  BURIED: ${vcBuried} (${((vcBuried/vcReviews.length)*100).toFixed(1)}%)`);
  console.log(`  CRYSTAL_CLEAR: ${vcReviews.length - vcBuried} (${(((vcReviews.length-vcBuried)/vcReviews.length)*100).toFixed(1)}%)`);

  // Low end
  const leMuddy = reviews.filter(r => r.lowEndClarity === "BOTH_MUDDY").length;
  console.log(`\n--- Low End Muddy ---\n  MUDDY: ${leMuddy} (${pct(leMuddy)})`);

  // Dynamics
  const dynComp = reviews.filter(r => r.dynamics === "TOO_COMPRESSED").length;
  console.log(`\n--- Too Compressed ---\n  YES: ${dynComp} (${pct(dynComp)})`);

  // Stereo width
  const swNarrow = reviews.filter(r => r.stereoWidth === "TOO_NARROW").length;
  console.log(`\n--- Stereo Too Narrow ---\n  YES: ${swNarrow} (${pct(swNarrow)})`);

  // Next focus
  const nf: Record<string, number> = {};
  reviews.forEach(r => { if (r.nextFocus) nf[r.nextFocus] = (nf[r.nextFocus] || 0) + 1; });
  console.log("\n--- Next Focus ---");
  Object.entries(nf).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} (${pct(v)})`));

  // Playlist action
  const pa: Record<string, number> = {};
  reviews.forEach(r => { if (r.playlistAction) pa[r.playlistAction] = (pa[r.playlistAction] || 0) + 1; });
  console.log("\n--- Playlist Action ---");
  Object.entries(pa).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} (${pct(v)})`));

  // Would listen again
  const wla = reviews.filter(r => r.wouldListenAgain === true).length;
  console.log(`\n--- Would Listen Again ---\n  YES: ${wla} (${pct(wla)})`);

  // Avg scores
  const withProd = reviews.filter(r => r.productionScore != null);
  const withOrig = reviews.filter(r => r.originalityScore != null);
  const avgProd = withProd.reduce((a, r) => a + r.productionScore!, 0) / withProd.length;
  const avgOrig = withOrig.reduce((a, r) => a + r.originalityScore!, 0) / withOrig.length;
  console.log(`\n--- Avg Scores ---`);
  console.log(`  Production: ${avgProd.toFixed(2)} / 5`);
  console.log(`  Originality: ${avgOrig.toFixed(2)} / 5`);

  // Track length
  const tlLong = reviews.filter(r => r.trackLength === "WAY_TOO_LONG").length;
  console.log(`\n--- Track Too Long ---\n  YES: ${tlLong} (${pct(tlLong)})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
