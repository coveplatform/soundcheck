import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = await hash("Test123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "testreviewer@mixreflect.com" },
    update: {
      password: passwordHash,
      name: "echo.studio",
      isReviewer: true,
      emailVerified: new Date(),
    },
    create: {
      email: "testreviewer@mixreflect.com",
      password: passwordHash,
      name: "echo.studio",
      isReviewer: true,
      isArtist: false,
      emailVerified: new Date(),
    },
  });

  // Get some genres
  const genres = await prisma.genre.findMany({ take: 5 });

  const profile = await prisma.reviewerProfile.upsert({
    where: { userId: user.id },
    update: {
      completedOnboarding: true,
      onboardingQuizPassed: true,
      onboardingQuizScore: 4,
      country: "AU",
      genres: { set: genres.map((g) => ({ id: g.id })) },
    },
    create: {
      userId: user.id,
      tier: "NORMAL",
      totalReviews: 12,
      averageRating: 4.3,
      completedOnboarding: true,
      onboardingQuizPassed: true,
      onboardingQuizScore: 4,
      country: "AU",
      genres: { connect: genres.map((g) => ({ id: g.id })) },
    },
  });

  console.log("========================================");
  console.log("TEST REVIEWER ACCOUNT CREATED");
  console.log("========================================");
  console.log("");
  console.log("Email:    testreviewer@mixreflect.com");
  console.log("Password: Test123!");
  console.log("Name:     echo.studio");
  console.log("");
  console.log("Onboarding: Complete");
  console.log("Quiz:       Passed");
  console.log("Verified:   Yes");
  console.log("");
  console.log("========================================");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
