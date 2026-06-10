import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  // Mirror the FIXED weekly-digest select to prove it no longer throws
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const users = await (prisma as any).user.findMany({
    where: {
      NOT: { email: { endsWith: "@seed.mixreflect.com" } },
      ArtistProfile: {
        completedOnboarding: true,
        subscriptionStatus: { not: "active" },
        updatedAt: { gte: thirtyDaysAgo },
      },
    },
    select: {
      email: true,
      ArtistProfile: {
        select: {
          artistName: true,
          reviewCredits: true,
          Genre_ArtistGenres: { select: { id: true } },
        },
      },
    },
  });
  console.log(`[FIXED QUERY OK] weekly-digest candidate pool (free, active <30d): ${users.length} users`);

  // Owner specifically
  const owner = await (prisma as any).user.findUnique({
    where: { email: "kris.engelhardt4@gmail.com" },
    select: {
      email: true,
      ArtistProfile: { select: { subscriptionStatus: true, updatedAt: true, completedOnboarding: true } },
    },
  });
  const p = owner?.ArtistProfile;
  console.log(`\nOwner: subscriptionStatus=${p?.subscriptionStatus} onboarded=${p?.completedOnboarding} updatedAt=${p?.updatedAt ? new Date(p.updatedAt).toISOString().slice(0,10) : "n/a"}`);
  console.log(`  → in free pool: ${p && p.subscriptionStatus !== "active" && p.completedOnboarding && new Date(p.updatedAt) >= thirtyDaysAgo}`);

  // TOTD: were there any analytic reviews dated 06-06 (input for the 06-07 finalize run)?
  const start = new Date("2026-06-06T00:00:00.000Z");
  const end = new Date("2026-06-06T23:59:59.999Z");
  const jun6 = await (prisma as any).review.count({
    where: { status: "COMPLETED", countsTowardAnalytics: true, updatedAt: { gte: start, lte: end } },
  });
  console.log(`\nTOTD: analytic reviews dated 2026-06-06 (input for 06-07 00:01 finalize): ${jun6}`);
  const anyJun6Sub = await (prisma as any).chartSubmission.count({ where: { chartDate: start } });
  console.log(`     chartSubmission rows with chartDate 2026-06-06: ${anyJun6Sub}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
