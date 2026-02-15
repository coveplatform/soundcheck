import { prisma } from "../src/lib/prisma";

async function check() {
  const testUser = await prisma.user.findUnique({
    where: { email: "testlink@gmail.com" },
    select: {
      id: true,
      email: true,
      referralCode: true,
      referredByCode: true,
      referralCouponId: true,
      createdAt: true,
    }
  });

  console.log("=== testlink@gmail.com ===");
  console.log(testUser);

  const krisUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: "KRIS.ENGELHARDT4@GMAIL.COM",
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      email: true,
      referralCode: true,
    }
  });

  console.log("\n=== KRIS account ===");
  console.log(krisUser);

  await prisma.$disconnect();
}

check().catch(console.error);
