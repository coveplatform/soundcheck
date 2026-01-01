import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  // Clear rate limits for demo user
  const result = await prisma.rateLimit.deleteMany({
    where: {
      id: {
        contains: "demo-artist@soundcheck.com"
      }
    }
  });
  console.log("Cleared rate limits:", result.count);

  // Also clear any login rate limits
  const result2 = await prisma.rateLimit.deleteMany({
    where: {
      id: {
        startsWith: "login:"
      }
    }
  });
  console.log("Cleared all login rate limits:", result2.count);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
