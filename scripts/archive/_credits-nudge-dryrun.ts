import { prisma } from "../../src/lib/prisma";

async function main() {
const idleThreshold = new Date();
idleThreshold.setUTCDate(idleThreshold.getUTCDate() - 1);
const nudgeCooldown = new Date();
nudgeCooldown.setUTCDate(nudgeCooldown.getUTCDate() - 28);

const users = await prisma.user.findMany({
  where: {
    NOT: { email: { endsWith: "@seed.mixreflect.com" } },
    OR: [
      { lastActiveAt: { lte: idleThreshold } },
      { lastActiveAt: null },
    ],
    ArtistProfile: {
      is: {
        completedOnboarding: true,
        OR: [{ subscriptionStatus: null }, { subscriptionStatus: { not: "active" } }],
        reviewCredits: { gte: 1 },
        OR: [
          { lastCreditNudgeAt: null },
          { lastCreditNudgeAt: { lte: nudgeCooldown } },
        ],
      },
    },
  },
  select: {
    email: true,
    lastActiveAt: true,
    ArtistProfile: {
      select: {
        reviewCredits: true,
        Track: {
          where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
          select: { id: true },
          take: 1,
        },
      },
    },
  },
});

const eligible = users.filter((u) => (u.ArtistProfile?.Track?.length ?? 0) === 0);
const skipped = users.length - eligible.length;

console.log(`\n--- WITH 28-day cooldown (what cron sends) ---`);
console.log(`Total matching query: ${users.length}`);
console.log(`Skipped (active submission in queue): ${skipped}`);
console.log(`Would receive email: ${eligible.length}`);

// Now check WITHOUT the cooldown to see the real underlying pool
const allIdle = await prisma.user.findMany({
  where: {
    NOT: { email: { endsWith: "@seed.mixreflect.com" } },
    OR: [
      { lastActiveAt: { lte: idleThreshold } },
      { lastActiveAt: null },
    ],
    ArtistProfile: {
      is: {
        completedOnboarding: true,
        OR: [{ subscriptionStatus: null }, { subscriptionStatus: { not: "active" } }],
        reviewCredits: { gte: 1 },
      },
    },
  },
  select: {
    email: true,
    lastActiveAt: true,
    ArtistProfile: {
      select: {
        reviewCredits: true,
        lastCreditNudgeAt: true,
        Track: {
          where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
          select: { id: true },
          take: 1,
        },
      },
    },
  },
});

const allEligible = allIdle.filter((u) => (u.ArtistProfile?.Track?.length ?? 0) === 0);
const inCooldown = allEligible.filter((u) => {
  const nudgedAt = u.ArtistProfile?.lastCreditNudgeAt;
  return nudgedAt && nudgedAt > nudgeCooldown;
});
const neverNudged = allEligible.filter((u) => !u.ArtistProfile?.lastCreditNudgeAt);
const readyNow = allEligible.filter((u) => {
  const nudgedAt = u.ArtistProfile?.lastCreditNudgeAt;
  return !nudgedAt || nudgedAt <= nudgeCooldown;
});

console.log(`\n--- WITHOUT cooldown (real underlying pool) ---`);
console.log(`Total idle free users with credits: ${allEligible.length}`);
console.log(`  Never been nudged:  ${neverNudged.length}`);
console.log(`  In 28-day cooldown: ${inCooldown.length}`);
console.log(`  Ready now (no cooldown): ${readyNow.length}`);

console.log(`\nBreakdown by credits (all idle pool):`);
const byCredits: Record<number, number> = {};
for (const u of allEligible) {
  const c = u.ArtistProfile!.reviewCredits;
  byCredits[c] = (byCredits[c] || 0) + 1;
}
Object.entries(byCredits)
  .sort(([a], [b]) => Number(a) - Number(b))
  .forEach(([c, n]) => console.log(`  ${c} credit${Number(c) === 1 ? "" : "s"}: ${n} user${n === 1 ? "" : "s"}`));

// Full funnel breakdown — show exactly where users drop out
console.log(`\n--- FULL FUNNEL ---`);
const allFree = await prisma.user.findMany({
  where: {
    NOT: { email: { endsWith: "@seed.mixreflect.com" } },
    ArtistProfile: { is: { completedOnboarding: true, OR: [{ subscriptionStatus: null }, { subscriptionStatus: { not: "active" } }] } },
  },
  select: {
    lastActiveAt: true,
    ArtistProfile: { select: { reviewCredits: true, Track: { where: { status: { in: ["QUEUED","IN_PROGRESS"] } }, select: { id: true }, take: 1 } } },
  },
});

const totalFree         = allFree.length;
const withCredits       = allFree.filter(u => (u.ArtistProfile?.reviewCredits ?? 0) >= 1);
const idleWithCredits   = withCredits.filter(u => !u.lastActiveAt || u.lastActiveAt <= idleThreshold);
const noActiveSubmit    = idleWithCredits.filter(u => (u.ArtistProfile?.Track?.length ?? 0) === 0);

console.log(`Free users (onboarded, non-pro, non-seed): ${totalFree}`);
console.log(`  → with 1+ credits:               ${withCredits.length}  (${totalFree - withCredits.length} have 0 credits)`);
console.log(`  → idle 1+ day:                   ${idleWithCredits.length}  (${withCredits.length - idleWithCredits.length} logged in within last 24h)`);
console.log(`  → no active submission in queue: ${noActiveSubmit.length}  (${idleWithCredits.length - noActiveSubmit.length} already have track queued)`);

await prisma.$disconnect();
}
main().catch(console.error);
