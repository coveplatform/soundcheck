import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL is not defined (set DATABASE_URL or POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING/POSTGRES_URL)"
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// Test reviewer accounts with realistic names
const testReviewers = [
  { name: "Davo2", email: "davo2@mixreflect.com", password: "TestReview123!" },
  { name: "Simli", email: "simli@mixreflect.com", password: "TestReview123!" },
  { name: "Roserncliff", email: "roserncliff@mixreflect.com", password: "TestReview123!" },
  { name: "MarcusT", email: "marcust@mixreflect.com", password: "TestReview123!" },
  { name: "BeatsByJay", email: "beatsbyjay@mixreflect.com", password: "TestReview123!" },
  { name: "SynthQueen", email: "synthqueen@mixreflect.com", password: "TestReview123!" },
  { name: "Kira_M", email: "kiram@mixreflect.com", password: "TestReview123!" },
  { name: "DeepGroove", email: "deepgroove@mixreflect.com", password: "TestReview123!" },
  { name: "TomWilson", email: "tomwilson@mixreflect.com", password: "TestReview123!" },
  { name: "NightOwl99", email: "nightowl99@mixreflect.com", password: "TestReview123!" },
];

async function main() {
  console.log("Creating test reviewer accounts...\n");

  // Get some genres to assign to reviewers
  const genres = await prisma.genre.findMany({
    take: 20,
  });

  if (genres.length < 3) {
    console.error("Not enough genres in database. Run 'npx prisma db seed' first.");
    process.exit(1);
  }

  const createdAccounts: { name: string; email: string; password: string }[] = [];

  for (const reviewer of testReviewers) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(reviewer.password, 10);

      // Pick 3-5 random genres for this reviewer
      const shuffled = [...genres].sort(() => Math.random() - 0.5);
      const reviewerGenres = shuffled.slice(0, 3 + Math.floor(Math.random() * 3));

      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: reviewer.email },
        update: {
          password: hashedPassword,
          name: reviewer.name,
          isReviewer: true,
          emailVerified: new Date(),
        },
        create: {
          email: reviewer.email,
          password: hashedPassword,
          name: reviewer.name,
          isReviewer: true,
          isArtist: false,
          emailVerified: new Date(),
        },
      });

      // Create or update reviewer profile
      await prisma.reviewerProfile.upsert({
        where: { userId: user.id },
        update: {
          completedOnboarding: true,
          onboardingQuizPassed: true,
          onboardingQuizScore: 4,
          country: "AU",
          genres: {
            set: reviewerGenres.map((g) => ({ id: g.id })),
          },
        },
        create: {
          userId: user.id,
          tier: Math.random() > 0.7 ? "PRO" : "NORMAL",
          totalReviews: Math.floor(Math.random() * 50) + 10,
          averageRating: 4.0 + Math.random() * 0.8,
          completedOnboarding: true,
          onboardingQuizPassed: true,
          onboardingQuizScore: 4,
          country: "AU",
          genres: {
            connect: reviewerGenres.map((g) => ({ id: g.id })),
          },
        },
      });

      createdAccounts.push({
        name: reviewer.name,
        email: reviewer.email,
        password: reviewer.password,
      });

      console.log(`Created reviewer: ${reviewer.name} (${reviewer.email})`);
    } catch (error) {
      console.error(`Failed to create ${reviewer.name}:`, error);
    }
  }

  console.log("\n========================================");
  console.log("TEST REVIEWER ACCOUNTS CREATED");
  console.log("========================================\n");

  console.log("| Name         | Email                        | Password        |");
  console.log("|--------------|------------------------------|-----------------|");
  for (const account of createdAccounts) {
    console.log(
      `| ${account.name.padEnd(12)} | ${account.email.padEnd(28)} | ${account.password.padEnd(15)} |`
    );
  }

  console.log("\n========================================\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
