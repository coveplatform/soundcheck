import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_URL,
  }),
});

async function main() {
  const now = new Date();
  const d = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const notSeed = { not: { endsWith: "@seed.mixreflect.com" } };

  // ── USER FUNNEL ──────────────────────────────────────────────
  const totalReal = await db.user.count({ where: { email: notSeed } });
  const onboarded = await db.artistProfile.count({ where: { completedOnboarding: true, User: { email: notSeed } } });
  const submitted = await db.track.groupBy({ by: ["artistId"], where: { paidAt: { not: null }, ArtistProfile: { User: { email: notSeed } } } });
  const submittedIds = submitted.map((s) => s.artistId);
  const repeatSubmitters = submitted.filter((s) => s).length; // will refine below

  // Track submission counts per artist
  const trackCounts = await db.track.groupBy({
    by: ["artistId"],
    where: { paidAt: { not: null }, ArtistProfile: { User: { email: notSeed } } },
    _count: { id: true },
  });
  const multiSubmitters = trackCounts.filter((t) => t._count.id >= 2).length;
  const powerUsers = trackCounts.filter((t) => t._count.id >= 3).length;

  // ── COHORT RETENTION: signed up in different windows ────────
  // Users who signed up >7d ago — have they been active in last 7d?
  const signedUp7to14 = await db.user.findMany({
    where: { createdAt: { gte: d(14), lt: d(7) }, email: notSeed },
    select: { lastActiveAt: true },
  });
  const retained7to14 = signedUp7to14.filter((u) => u.lastActiveAt && u.lastActiveAt >= d(7)).length;

  const signedUp14to30 = await db.user.findMany({
    where: { createdAt: { gte: d(30), lt: d(14) }, email: notSeed },
    select: { lastActiveAt: true },
  });
  const retained14to30 = signedUp14to30.filter((u) => u.lastActiveAt && u.lastActiveAt >= d(7)).length;

  // ── CREDIT HEALTH ────────────────────────────────────────────
  const creditBuckets = await db.artistProfile.findMany({
    where: { User: { email: notSeed } },
    select: { reviewCredits: true, totalCreditsEarned: true, totalCreditsSpent: true, totalPeerReviews: true },
  });

  const zeroCredits = creditBuckets.filter((u) => u.reviewCredits === 0).length;
  const lowCredits  = creditBuckets.filter((u) => u.reviewCredits >= 1 && u.reviewCredits <= 2).length;
  const richCredits = creditBuckets.filter((u) => u.reviewCredits >= 5).length;
  const reviewersWhoNeverSubmitted = creditBuckets.filter((u) => u.totalPeerReviews > 0 && !submittedIds.includes("")).length;

  // Who earns credits (reviews) but never submits a track?
  const artistsWithReviewsNoTracks = await db.artistProfile.count({
    where: {
      totalPeerReviews: { gt: 0 },
      totalTracks: 0,
      User: { email: notSeed },
    },
  });

  // ── TRACK OUTCOMES ───────────────────────────────────────────
  const completedTracks = await db.track.count({ where: { status: "COMPLETED", ArtistProfile: { User: { email: notSeed } } } });
  const inProgressTracks = await db.track.count({ where: { status: "IN_PROGRESS", ArtistProfile: { User: { email: notSeed } } } });
  const uploadedNotSubmitted = await db.track.count({ where: { status: "UPLOADED", ArtistProfile: { User: { email: notSeed } } } });

  // Did users who got reviews come back?
  const gotReviewsThenInactive = await db.user.count({
    where: {
      email: notSeed,
      lastActiveAt: { lt: d(14) },
      ArtistProfile: { totalTracks: { gt: 0 } },
    },
  });

  // ── SIGNUP VELOCITY ──────────────────────────────────────────
  const today    = await db.user.count({ where: { createdAt: { gte: d(1) },  email: notSeed } });
  const last7d   = await db.user.count({ where: { createdAt: { gte: d(7) },  email: notSeed } });
  const last30d  = await db.user.count({ where: { createdAt: { gte: d(30) }, email: notSeed } });

  // ── TOP ENGAGERS ─────────────────────────────────────────────
  const topReviewers = await db.artistProfile.findMany({
    where: { User: { email: notSeed }, totalPeerReviews: { gt: 0 } },
    orderBy: { totalPeerReviews: "desc" },
    take: 10,
    select: { totalPeerReviews: true, totalTracks: true, reviewCredits: true, subscriptionStatus: true, User: { select: { email: true, lastActiveAt: true } } },
  });

  const topUploaders = await db.artistProfile.findMany({
    where: { User: { email: notSeed }, totalTracks: { gt: 1 } },
    orderBy: { totalTracks: "desc" },
    take: 10,
    select: { totalTracks: true, totalPeerReviews: true, reviewCredits: true, subscriptionStatus: true, User: { select: { email: true, lastActiveAt: true } } },
  });

  // ── AT-RISK: active but credits gone ─────────────────────────
  const atRisk = await db.artistProfile.findMany({
    where: {
      reviewCredits: 0,
      totalTracks: { gt: 0 },
      User: { email: notSeed, lastActiveAt: { gte: d(14) } },
    },
    select: { reviewCredits: true, totalTracks: true, totalPeerReviews: true, subscriptionStatus: true, User: { select: { email: true, lastActiveAt: true } } },
    orderBy: { User: { lastActiveAt: "desc" } },
  });

  // ── GENRE BREAKDOWN ──────────────────────────────────────────
  const genreBreakdown = await db.genre.findMany({
    select: { name: true, _count: { select: { Track: true, ArtistProfile_ArtistGenres: true } } },
    orderBy: { Track: { _count: "desc" } },
    take: 10,
  });

  // ── REVIEW QUALITY ───────────────────────────────────────────
  const avgListenDuration = await db.review.aggregate({
    _avg: { listenDuration: true },
    where: { status: "COMPLETED", isPeerReview: true },
  });
  const gemReviews = await db.review.count({ where: { isGem: true } });
  const flaggedReviews = await db.review.count({ where: { wasFlagged: true } });

  // ── FIRST IMPRESSION DISTRIBUTION ────────────────────────────
  const firstImpressions = await db.review.groupBy({
    by: ["firstImpression"],
    _count: true,
    where: { status: "COMPLETED", firstImpression: { not: null } },
  });

  const qualityLevels = await db.review.groupBy({
    by: ["qualityLevel"],
    _count: true,
    where: { status: "COMPLETED", qualityLevel: { not: null } },
  });

  // ── OUTPUT ────────────────────────────────────────────────────
  console.log("\n============ DEEP ANALYSIS ============\n");

  console.log("── FUNNEL ──────────────────────────────");
  console.log(`  Signed up:              ${totalReal}`);
  console.log(`  Completed onboarding:   ${onboarded} (${pct(onboarded, totalReal)}%)`);
  console.log(`  Submitted 1+ track:     ${submittedIds.length} (${pct(submittedIds.length, totalReal)}%)`);
  console.log(`  Submitted 2+ tracks:    ${multiSubmitters} (${pct(multiSubmitters, totalReal)}%)`);
  console.log(`  Submitted 3+ tracks:    ${powerUsers} (${pct(powerUsers, totalReal)}%)`);
  console.log(`  Reviewing but no upload:${artistsWithReviewsNoTracks}`);

  console.log("\n── COHORT RETENTION ─────────────────────");
  console.log(`  Signed up 7-14d ago:    ${signedUp7to14.length} users → ${retained7to14} still active this week (${pct(retained7to14, signedUp7to14.length)}%)`);
  console.log(`  Signed up 14-30d ago:   ${signedUp14to30.length} users → ${retained14to30} still active this week (${pct(retained14to30, signedUp14to30.length)}%)`);

  console.log("\n── SIGNUP VELOCITY ──────────────────────");
  console.log(`  Today:                  ${today}`);
  console.log(`  Last 7 days:            ${last7d}`);
  console.log(`  Last 30 days:           ${last30d}`);
  console.log(`  Daily avg (30d):        ${(last30d / 30).toFixed(1)}/day`);

  console.log("\n── CREDIT HEALTH ────────────────────────");
  console.log(`  At 0 credits:           ${zeroCredits}`);
  console.log(`  At 1-2 credits:         ${lowCredits}`);
  console.log(`  At 5+ credits:          ${richCredits}`);

  console.log("\n── TRACK STATUS ─────────────────────────");
  console.log(`  Completed:              ${completedTracks}`);
  console.log(`  In progress:            ${inProgressTracks}`);
  console.log(`  Uploaded not submitted: ${uploadedNotSubmitted}`);
  console.log(`  Got reviews, now gone (>14d): ${gotReviewsThenInactive}`);

  console.log("\n── TOP GENRES ───────────────────────────");
  genreBreakdown.forEach((g) =>
    console.log(`  ${g.name}: ${g._count.Track} tracks, ${g._count.ArtistProfile_ArtistGenres} artists`)
  );

  console.log("\n── REVIEW QUALITY ───────────────────────");
  console.log(`  Avg listen duration:    ${Math.round(avgListenDuration._avg.listenDuration ?? 0)}s`);
  console.log(`  Gem reviews:            ${gemReviews}`);
  console.log(`  Flagged reviews:        ${flaggedReviews}`);

  console.log("\n── FIRST IMPRESSIONS (all completed) ───");
  firstImpressions.forEach((f) => console.log(`  ${f.firstImpression}: ${f._count}`));

  console.log("\n── QUALITY LEVELS ───────────────────────");
  qualityLevels.forEach((q) => console.log(`  ${q.qualityLevel}: ${q._count}`));

  console.log("\n── TOP REVIEWERS ────────────────────────");
  topReviewers.forEach((u) => {
    const dAgo = u.User.lastActiveAt ? Math.floor((now.getTime() - u.User.lastActiveAt.getTime()) / 86400000) : null;
    console.log(`  ${u.User.email} | reviews: ${u.totalPeerReviews} | tracks: ${u.totalTracks} | credits: ${u.reviewCredits} | active: ${dAgo !== null ? dAgo + "d ago" : "never"} | sub: ${u.subscriptionStatus ?? "none"}`);
  });

  console.log("\n── TOP UPLOADERS ────────────────────────");
  topUploaders.forEach((u) => {
    const dAgo = u.User.lastActiveAt ? Math.floor((now.getTime() - u.User.lastActiveAt.getTime()) / 86400000) : null;
    console.log(`  ${u.User.email} | tracks: ${u.totalTracks} | reviews: ${u.totalPeerReviews} | credits: ${u.reviewCredits} | active: ${dAgo !== null ? dAgo + "d ago" : "never"} | sub: ${u.subscriptionStatus ?? "none"}`);
  });

  console.log("\n── AT-RISK (active, 0 credits, has uploaded) ──");
  atRisk.forEach((u) => {
    const dAgo = u.User.lastActiveAt ? Math.floor((now.getTime() - u.User.lastActiveAt.getTime()) / 86400000) : null;
    console.log(`  ${u.User.email} | tracks: ${u.totalTracks} | reviews given: ${u.totalPeerReviews} | active: ${dAgo !== null ? dAgo + "d ago" : "never"}`);
  });

  console.log("\n========================================\n");
}

function pct(n: number, total: number) {
  if (total === 0) return "0";
  return Math.round((n / total) * 100);
}

main().catch(console.error).finally(() => db.$disconnect());
