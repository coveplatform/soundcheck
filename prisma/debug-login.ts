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
  const email = "demo-artist@soundcheck.com";
  const password = "demo123456";

  const normalizedEmail = email.trim().toLowerCase();
  console.log("Looking for email:", normalizedEmail);

  // Exact same query as auth.ts
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    console.log("ERROR: User not found!");
    return;
  }

  console.log("\nUser found:");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Password hash:", user.password?.substring(0, 20) + "...");
  console.log("  Email verified:", user.emailVerified);

  if (!user.password) {
    console.log("ERROR: User has no password!");
    return;
  }

  if (!user.emailVerified) {
    console.log("ERROR: Email not verified!");
    return;
  }

  // Test password comparison
  const isValid = await bcrypt.compare(password, user.password);
  console.log("\nPassword comparison result:", isValid);

  if (!isValid) {
    console.log("\nTrying to create new hash and update...");
    const newHash = await bcrypt.hash(password, 10);
    console.log("New hash created:", newHash.substring(0, 20) + "...");

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash }
    });
    console.log("Password updated with new hash!");

    // Verify it works now
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (updatedUser?.password) {
      const verifyAgain = await bcrypt.compare(password, updatedUser.password);
      console.log("Verification after update:", verifyAgain);
    }
  }

  // Also list all users with similar emails to check for duplicates
  const allUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: "demo",
        mode: "insensitive"
      }
    },
    select: { id: true, email: true, isArtist: true }
  });
  console.log("\nAll demo users in database:");
  allUsers.forEach(u => console.log(`  ${u.email} (artist: ${u.isArtist})`));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
