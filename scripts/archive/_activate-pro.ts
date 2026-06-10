import { prisma } from "../../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "kris.engelhardt4@gmail.com" },
    select: { id: true }
  });
  if (!user) throw new Error("User not found");

  const profile = await prisma.artistProfile.update({
    where: { userId: user.id },
    data: {
      subscriptionStatus: "active",
      reviewCredits: { increment: 30 },
      totalCreditsEarned: { increment: 30 },
    },
    select: { artistName: true, subscriptionStatus: true, reviewCredits: true }
  });

  console.log("Done:", profile);
  await prisma.$disconnect();
}

main().catch(console.error);
