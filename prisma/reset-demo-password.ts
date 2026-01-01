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
  // Use bcrypt.hashSync with cost 10 (same as NextAuth default)
  const password = "demo123456";
  const hash = bcrypt.hashSync(password, 10);

  console.log("New hash:", hash);
  console.log("Verify immediately:", bcrypt.compareSync(password, hash));

  const result = await prisma.user.update({
    where: { email: "demo-artist@soundcheck.com" },
    data: {
      password: hash,
      // Also make absolutely sure email is verified
      emailVerified: new Date()
    }
  });

  console.log("Updated user:", result.email);

  // Verify from database
  const user = await prisma.user.findUnique({
    where: { email: "demo-artist@soundcheck.com" }
  });

  if (user?.password) {
    console.log("DB verify:", bcrypt.compareSync(password, user.password));
  }

  // Also clear ALL rate limits just in case
  await prisma.rateLimit.deleteMany({});
  console.log("Cleared all rate limits");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
