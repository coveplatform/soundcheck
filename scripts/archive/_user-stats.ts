import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const now = new Date();
  const d = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const notSeed = { not: { endsWith: "@seed.mixreflect.com" } };

  const totalUsers = await prisma.user.count();
  const seedUsers  = await prisma.user.count({ where: { email: { endsWith: "@seed.mixreflect.com" } } });
  const realUsers  = totalUsers - seedUsers;

  const signups7d  = await prisma.user.count({ where: { createdAt: { gte: d(7) },  email: notSeed } });
  const signups14d = await prisma.user.count({ where: { createdAt: { gte: d(14) }, email: notSeed } });
  const signups30d = await prisma.user.count({ where: { createdAt: { gte: d(30) }, email: notSeed } });

  const activeToday = await prisma.user.count({ where: { lastActiveAt: { gte: d(1) },  email: notSeed } });
  const active7d    = await prisma.user.count({ where: { lastActiveAt: { gte: d(7) },  email: notSeed } });
  const active30d   = await prisma.user.count({ where: { lastActiveAt: { gte: d(30) }, email: notSeed } });
  const neverActive = await prisma.user.count({ where: { lastActiveAt: null,           email: notSeed } });
  const dead30d     = await prisma.user.count({ where: { lastActiveAt: { lt: d(30) },  email: notSeed } });

  const onboardedArtist   = await prisma.artistProfile.count({ where: { completedOnboarding: true } });
  const unonboardedArtist = await prisma.artistProfile.count({ where: { completedOnboarding: false } });
  const onboardedReviewer = await prisma.reviewerProfile.count({ where: { completedOnboarding: true } });

  const totalTracks      = await prisma.track.count({ where: { ArtistProfile: { User: { email: notSeed } } } });
  const tracksLast7d     = await prisma.track.count({ where: { createdAt: { gte: d(7) },  ArtistProfile: { User: { email: notSeed } } } });
  const tracksLast30d    = await prisma.track.count({ where: { createdAt: { gte: d(30) }, ArtistProfile: { User: { email: notSeed } } } });
  const usersWithTracks  = await prisma.artistProfile.count({ where: { totalTracks: { gt: 0 }, User: { email: notSeed } } });
  const usersNoTracks    = await prisma.artistProfile.count({ where: { totalTracks: 0,       User: { email: notSeed } } });
  const uploadedThenDead = await prisma.user.count({ where: { email: notSeed, lastActiveAt: { lt: d(14) }, ArtistProfile: { totalTracks: { gt: 0 } } } });

  const trackStatuses = await prisma.track.groupBy({
    by: ["status"],
    _count: true,
    where: { ArtistProfile: { User: { email: notSeed } } },
  });

  const totalReviews = await prisma.review.count({ where: { status: "COMPLETED", countsTowardAnalytics: true } });
  const peerReviews  = await prisma.review.count({ where: { status: "COMPLETED", isPeerReview: true } });
  const reviews7d    = await prisma.review.count({ where: { status: "COMPLETED", updatedAt: { gte: d(7) } } });

  const activeSubs = await prisma.artistProfile.count({ where: { subscriptionStatus: "active" } });
  const subTiers   = await prisma.artistProfile.groupBy({ by: ["subscriptionTier"], _count: true, where: { subscriptionStatus: "active" } });

  const avgCredits  = await prisma.artistProfile.aggregate({ _avg: { reviewCredits: true }, where: { User: { email: notSeed } } });
  const zeroCredits = await prisma.artistProfile.count({ where: { reviewCredits: 0, User: { email: notSeed } } });

  const leads          = await prisma.leadCapture.count();
  const leadsConverted = await prisma.leadCapture.count({ where: { converted: true } });

  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: d(14) }, email: notSeed },
    select: {
      email: true,
      createdAt: true,
      lastActiveAt: true,
      ArtistProfile: { select: { totalTracks: true, completedOnboarding: true, reviewCredits: true, subscriptionStatus: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n========== MIXREFLECT USER STATS ==========\n");

  console.log("TOTALS");
  console.log(`  Total users:          ${totalUsers}`);
  console.log(`  Seed accounts:        ${seedUsers}`);
  console.log(`  Real users:           ${realUsers}`);
  console.log(`  Lead captures:        ${leads} (${leadsConverted} converted)\n`);

  console.log("SIGNUPS");
  console.log(`  Last 7 days:          ${signups7d}`);
  console.log(`  Last 14 days:         ${signups14d}`);
  console.log(`  Last 30 days:         ${signups30d}\n`);

  console.log("ACTIVITY (real users)");
  console.log(`  Active today:         ${activeToday}`);
  console.log(`  Active last 7d:       ${active7d}`);
  console.log(`  Active last 30d:      ${active30d}`);
  console.log(`  Never active:         ${neverActive}`);
  console.log(`  Gone >30 days:        ${dead30d}\n`);

  console.log("TRACKS");
  console.log(`  Total (real users):   ${totalTracks}`);
  console.log(`  Uploaded last 7d:     ${tracksLast7d}`);
  console.log(`  Uploaded last 30d:    ${tracksLast30d}`);
  console.log(`  Users with tracks:    ${usersWithTracks}`);
  console.log(`  Users with 0 tracks:  ${usersNoTracks}`);
  console.log(`  Uploaded then churned (>14d inactive): ${uploadedThenDead}`);
  trackStatuses.forEach((s) => console.log(`  Status ${s.status}: ${s._count}`));
  console.log();

  console.log("ONBOARDING");
  console.log(`  Artist onboarded:     ${onboardedArtist}`);
  console.log(`  Artist NOT onboarded: ${unonboardedArtist}`);
  console.log(`  Reviewer onboarded:   ${onboardedReviewer}\n`);

  console.log("REVIEWS");
  console.log(`  Total completed:      ${totalReviews}`);
  console.log(`  Peer reviews:         ${peerReviews}`);
  console.log(`  Last 7 days:          ${reviews7d}\n`);

  console.log("CREDITS");
  console.log(`  Avg credits/user:     ${avgCredits._avg.reviewCredits?.toFixed(1)}`);
  console.log(`  Users at 0 credits:   ${zeroCredits}\n`);

  console.log("SUBSCRIPTIONS");
  console.log(`  Active subscribers:   ${activeSubs}`);
  subTiers.forEach((t) => console.log(`  ${t.subscriptionTier ?? "none"}: ${t._count}`));
  console.log();

  console.log("RECENT SIGNUPS (last 14d)");
  recentUsers.forEach((u) => {
    const ap = u.ArtistProfile;
    const daysSince = u.lastActiveAt
      ? Math.floor((now.getTime() - u.lastActiveAt.getTime()) / 86400000)
      : null;
    console.log(
      `  ${u.email} | signed up ${u.createdAt.toISOString().split("T")[0]} | last active: ${daysSince !== null ? daysSince + "d ago" : "never"} | tracks: ${ap?.totalTracks ?? 0} | onboarded: ${ap?.completedOnboarding ?? false} | credits: ${ap?.reviewCredits ?? 0} | sub: ${ap?.subscriptionStatus ?? "none"}`
    );
  });

  console.log("\n============================================\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
