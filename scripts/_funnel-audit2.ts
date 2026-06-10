/** Read-only funnel audit part 2: who pays, where signups go. */
import { prisma } from "../src/lib/prisma";

const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
const d7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
const mask = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1***$2");

async function main() {
  // paid reports: real one-time checkout vs subscription back-unlock
  const paid = await prisma.trackScoreReport.findMany({
    where: { paidAt: { not: null } },
    select: { email: true, paidAt: true, stripeSessionId: true, humanRoomSkipped: true, createdAt: true },
    orderBy: { paidAt: "desc" },
  });

  const subs = await prisma.scoreSubscriber.findMany({
    select: { email: true, status: true, createdAt: true, stripeSubscriptionId: true, currentPeriodEnd: true },
    orderBy: { createdAt: "desc" },
  });

  // signups overall (classic platform users)
  const [users7, users30, usersAll] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count(),
  ]);

  // of users created in last 30d, how many have a score report under their email
  const overlap = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(DISTINCT u."email") AS n
    FROM "User" u
    WHERE u."createdAt" >= ${d30}
      AND EXISTS (SELECT 1 FROM "TrackScoreReport" r WHERE LOWER(r."email") = LOWER(u."email"))
  `;

  // distinct score-report emails + their report counts
  const reportEmails = await prisma.$queryRaw<{ email: string; n: bigint; paid: bigint }[]>`
    SELECT "email", COUNT(*) AS n, COUNT(*) FILTER (WHERE "paidAt" IS NOT NULL) AS paid
    FROM "TrackScoreReport" GROUP BY "email" ORDER BY n DESC
  `;

  // classic-product tracks last 30d (is the old funnel still where signups go?)
  const tracks30 = await prisma.track.count({ where: { createdAt: { gte: d30 } } });

  // score reviewer pool
  const scoreReviewers = await prisma.user.count({ where: { isScoreReviewer: true } });
  const reviews30 = await prisma.scoreReview.groupBy({ by: ["status"], _count: true });

  console.log(JSON.stringify({
    paidReports: paid.map(p => ({
      email: mask(p.email), paidAt: p.paidAt?.toISOString().slice(0, 16),
      viaCheckout: !!p.stripeSessionId, backUnlock: p.humanRoomSkipped,
    })),
    subscribers: subs.map(s => ({
      email: mask(s.email), status: s.status, created: s.createdAt.toISOString().slice(0, 16),
      hasStripeSub: !!s.stripeSubscriptionId,
    })),
    users: { last7: users7, last30: users30, all: usersAll },
    newUsersWithScoreReport30: Number(overlap[0]?.n ?? 0),
    reportEmails: reportEmails.map(r => ({ email: mask(r.email), reports: Number(r.n), paid: Number(r.paid) })),
    classicTracks30: tracks30,
    scoreReviewerPool: scoreReviewers,
    scoreReviewsByStatus: reviews30,
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
