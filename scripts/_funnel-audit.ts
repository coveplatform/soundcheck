/**
 * Read-only funnel audit: TrackScoreReport pipeline → payment.
 * Run: npx tsx scripts/_funnel-audit.ts
 */
import { prisma } from "../src/lib/prisma";

const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
const d14 = new Date(Date.now() - 14 * 24 * 3600 * 1000);
const d7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);

async function main() {
  const [total, t30, t14, t7] = await Promise.all([
    prisma.trackScoreReport.count(),
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d30 } } }),
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d14 } } }),
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d7 } } }),
  ]);

  const byStatus = await prisma.trackScoreReport.groupBy({
    by: ["status"],
    _count: true,
    where: { createdAt: { gte: d30 } },
  });

  const [claimed30, unclaimed30, paidAll, paid30, paid7] = await Promise.all([
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d30 }, claimedAt: { not: null } } }),
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d30 }, claimToken: { not: null }, claimedAt: null } }),
    prisma.trackScoreReport.count({ where: { paidAt: { not: null } } }),
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d30 }, paidAt: { not: null } } }),
    prisma.trackScoreReport.count({ where: { createdAt: { gte: d7 }, paidAt: { not: null } } }),
  ]);

  // grounded flag lives in reviewerQuotes JSON
  const grounded = await prisma.$queryRaw<{ grounded: string | null; n: bigint }[]>`
    SELECT ("reviewerQuotes"->>'grounded') AS grounded, COUNT(*) AS n
    FROM "TrackScoreReport"
    WHERE "createdAt" >= ${d30}
    GROUP BY 1
  `;

  // stuck pending (older than 1h, still no score)
  const stuck = await prisma.trackScoreReport.count({
    where: { createdAt: { gte: d30, lte: new Date(Date.now() - 3600 * 1000) }, score: null },
  });

  // checkout attempts: stripeSessionId set but never paid (one-time unlock path)
  const checkoutStartedNotPaid = await prisma.trackScoreReport.count({
    where: { createdAt: { gte: d30 }, stripeSessionId: { not: null }, paidAt: null },
  });

  const subs = await prisma.scoreSubscriber.groupBy({ by: ["status"], _count: true });

  // distinct emails (free users who got a report) last 30d
  const emails = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(DISTINCT "email") AS n FROM "TrackScoreReport"
    WHERE "createdAt" >= ${d30} AND "email" NOT LIKE '%@seed.mixreflect.com'
  `;

  // repeat submitters
  const repeats = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM (
      SELECT "email" FROM "TrackScoreReport"
      WHERE "createdAt" >= ${d30} GROUP BY "email" HAVING COUNT(*) > 1
    ) s
  `;

  // human room delivery on paid reports
  const paidRooms = await prisma.$queryRaw<{ paid: bigint; with_reviews: bigint }[]>`
    SELECT COUNT(*) AS paid,
           COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "ScoreReview" sr WHERE sr."reportId" = r."id")) AS with_reviews
    FROM "TrackScoreReport" r
    WHERE r."paidAt" IS NOT NULL AND r."createdAt" >= ${d30}
  `;

  // recent reports sample
  const recent = await prisma.trackScoreReport.findMany({
    where: { createdAt: { gte: d7 } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { createdAt: true, status: true, score: true, paidAt: true, claimedAt: true, claimToken: true, email: true, stripeSessionId: true },
  });

  console.log(JSON.stringify({
    totals: { all: total, last30: t30, last14: t14, last7: t7 },
    byStatus30: byStatus,
    claims30: { claimed: claimed30, unclaimedPreAuth: unclaimed30 },
    paid: { allTime: paidAll, last30: paid30, last7: paid7 },
    grounded30: grounded.map(g => ({ grounded: g.grounded, n: Number(g.n) })),
    stuckNoScore30: stuck,
    checkoutStartedNotPaid30: checkoutStartedNotPaid,
    subscribers: subs,
    distinctEmails30: Number(emails[0]?.n ?? 0),
    repeatEmails30: Number(repeats[0]?.n ?? 0),
    paidRooms30: paidRooms.map(p => ({ paid: Number(p.paid), withReviews: Number(p.with_reviews) })),
    recent: recent.map(r => ({
      at: r.createdAt.toISOString().slice(0, 16),
      status: r.status,
      score: r.score,
      paid: !!r.paidAt,
      claimed: !!r.claimedAt,
      preAuth: !!r.claimToken,
      checkout: !!r.stripeSessionId,
      email: r.email ? r.email.replace(/^(.{2}).*(@.*)$/, "$1***$2") : null,
    })),
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
