// NO dotenv - use only the DATABASE_URL from command line
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Hardcode production URL to be absolutely sure
const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to PRODUCTION database...");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

async function main() {
  const password = "test1234";
  const hash = bcrypt.hashSync(password, 10);

  // Delete test user if exists
  await prisma.user.deleteMany({ where: { email: "test@test.com" } });

  // Create fresh test user
  const user = await prisma.user.create({
    data: {
      email: "test@test.com",
      password: hash,
      name: "Test User",
      isArtist: true,
      emailVerified: new Date(),
    }
  });
  console.log("Created user:", user.email);

  // Create artist profile
  const houseGenre = await prisma.genre.findUnique({ where: { slug: "house" } });
  if (houseGenre) {
    await prisma.artistProfile.create({
      data: {
        userId: user.id,
        artistName: "Test Artist",
        genres: { connect: [{ id: houseGenre.id }] }
      }
    });
    console.log("Created artist profile");
  }

  // Clear rate limits
  await prisma.rateLimit.deleteMany({});
  console.log("Cleared rate limits");

  // Verify
  const verify = await prisma.user.findUnique({ where: { email: "test@test.com" } });
  if (verify?.password) {
    console.log("Password verify:", bcrypt.compareSync(password, verify.password));
  }

  // List all non-demo users
  const users = await prisma.user.findMany({
    where: { NOT: { email: { contains: "reviewer-demo" } } },
    select: { email: true, emailVerified: true }
  });
  console.log("\nAll users in PRODUCTION:");
  users.forEach(u => console.log(`  ${u.email} (verified: ${!!u.emailVerified})`));

  console.log("\n=== LOGIN WITH ===");
  console.log("Email: test@test.com");
  console.log("Password: test1234");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
