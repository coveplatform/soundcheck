import { prisma } from "../../src/lib/prisma";

async function main() {
  const groups = await prisma.artistProfile.groupBy({
    by: ["subscriptionStatus"],
    _count: true,
  });
  console.log("subscriptionStatus distribution:");
  console.log(JSON.stringify(groups, null, 2));

  // Sample a few "active" non-seed users to see if they're real paying users
  const activeProfiles = await prisma.artistProfile.findMany({
    where: { subscriptionStatus: "active" },
    select: {
      subscriptionStatus: true,
      subscriptionId: true,
      reviewCredits: true,
      User: { select: { email: true } },
    },
    take: 10,
  });
  console.log("\nSample 'active' profiles:");
  for (const p of activeProfiles) {
    const isSeed = p.User.email?.endsWith("@seed.mixreflect.com");
    console.log(`  ${p.User.email} | subId: ${p.subscriptionId ?? "NULL"} | credits: ${p.reviewCredits} | seed: ${isSeed}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
