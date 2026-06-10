import { prisma } from "../../src/lib/prisma";

async function main() {
  const [
    totalUsers,
    seedUsers,
    totalProfiles,
    onboarded,
    freeOnboarded,
    withCredits,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { email: { endsWith: "@seed.mixreflect.com" } } }),
    prisma.artistProfile.count(),
    prisma.artistProfile.count({ where: { completedOnboarding: true } }),
    prisma.artistProfile.count({ where: { completedOnboarding: true, subscriptionStatus: { not: "active" } } }),
    prisma.artistProfile.count({ where: { completedOnboarding: true, subscriptionStatus: { not: "active" }, reviewCredits: { gte: 1 } } }),
  ]);

  const idleThreshold = new Date();
  idleThreshold.setUTCDate(idleThreshold.getUTCDate() - 1);

  // How many of those have lastActiveAt > 1 day ago on their User record
  const idleCount = await prisma.user.count({
    where: {
      NOT: { email: { endsWith: "@seed.mixreflect.com" } },
      OR: [{ lastActiveAt: { lte: idleThreshold } }, { lastActiveAt: null }],
      ArtistProfile: {
        is: {
          completedOnboarding: true,
          subscriptionStatus: { not: "active" },
          reviewCredits: { gte: 1 },
        },
      },
    },
  });

  // How many logged in today
  const activeToday = await prisma.user.count({
    where: {
      NOT: { email: { endsWith: "@seed.mixreflect.com" } },
      lastActiveAt: { gt: idleThreshold },
      ArtistProfile: {
        is: {
          completedOnboarding: true,
          subscriptionStatus: { not: "active" },
          reviewCredits: { gte: 1 },
        },
      },
    },
  });

  console.log("=== User population ===");
  console.log(`Total users:               ${totalUsers}`);
  console.log(`Seed accounts:             ${seedUsers}`);
  console.log(`Real users:                ${totalUsers - seedUsers}`);
  console.log("");
  console.log("=== Artist profiles ===");
  console.log(`Total profiles:            ${totalProfiles}`);
  console.log(`Completed onboarding:      ${onboarded}`);
  console.log(`Free + onboarded:          ${freeOnboarded}`);
  console.log(`Free + onboarded + credits:${withCredits}`);
  console.log("");
  console.log("=== Idle check ===");
  console.log(`Active in last 24h:        ${activeToday}`);
  console.log(`Idle 1+ day:               ${idleCount}`);

  await prisma.$disconnect();
}

main().catch(console.error);
