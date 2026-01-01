import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const email = "test@test.com";
  const password = "test1234";
  const hash = bcrypt.hashSync(password, 10);

  // Delete if exists
  await prisma.user.deleteMany({ where: { email } });

  // Create fresh user
  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      name: "Test User",
      isArtist: true,
      emailVerified: new Date(),
    }
  });

  console.log("Created user:", user.email);

  // Create artist profile
  const houseGenre = await prisma.genre.findUnique({ where: { slug: "house" } });

  await prisma.artistProfile.create({
    data: {
      userId: user.id,
      artistName: "Test Artist",
      genres: houseGenre ? { connect: [{ id: houseGenre.id }] } : undefined
    }
  });

  console.log("Created artist profile");

  // Verify password works
  const verify = bcrypt.compareSync(password, hash);
  console.log("Password verify:", verify);

  // Clear rate limits
  await prisma.rateLimit.deleteMany({});
  console.log("Cleared rate limits");

  console.log("\n=== TRY THIS ===");
  console.log("Email: test@test.com");
  console.log("Password: test1234");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
