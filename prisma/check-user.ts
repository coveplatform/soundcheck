import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { compare } from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "demo-artist@soundcheck.com" },
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("User found:");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Has password:", !!user.password);
  console.log("  Email verified:", user.emailVerified);
  console.log("  Is artist:", user.isArtist);

  if (user.password) {
    const isValid = await compare("demo123456", user.password);
    console.log("  Password 'demo123456' valid:", isValid);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
