import { prisma } from "../../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "test-free@mixreflect.com";
  const password = "TestFree123!";

  // Clean up any existing test account
  await prisma.user.deleteMany({ where: { email } });

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: "Test Free User",
      password: hash,
      isArtist: true,
      ArtistProfile: {
        create: {
          artistName: "Test Artist",
          completedOnboarding: true,
          reviewCredits: 0,
          subscriptionStatus: null,
        },
      },
    },
  });

  console.log("Created test account:");
  console.log("  Email:    ", email);
  console.log("  Password: ", password);
  console.log("  userId:   ", user.id);
  console.log("\nLog in at http://localhost:3000/login");
  console.log("(click 'Use email and password instead')");

  await prisma.$disconnect();
}

main().catch(console.error);
