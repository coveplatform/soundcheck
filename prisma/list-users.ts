import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
console.log("Using DATABASE_URL:", databaseUrl?.substring(0, 50) + "...");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl! }),
});

async function main() {
  const users = await prisma.user.findMany({
    where: {
      NOT: { email: { contains: "reviewer-demo" } }
    },
    select: {
      email: true,
      password: true,
      emailVerified: true,
      isArtist: true
    },
    take: 20
  });

  console.log("\nUsers in production database:");
  for (const u of users) {
    const pwTest = u.password ? bcrypt.compareSync("test1234", u.password) : false;
    const pwDemo = u.password ? bcrypt.compareSync("demo123456", u.password) : false;
    console.log(`  ${u.email}`);
    console.log(`    verified: ${!!u.emailVerified} | artist: ${u.isArtist}`);
    console.log(`    pw=test1234: ${pwTest} | pw=demo123456: ${pwDemo}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
