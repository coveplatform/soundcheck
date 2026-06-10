/**
 * Grandfather current Classic Pro users onto the new "unlimited" plan.
 *
 * Classic Pro = ArtistProfile.subscriptionStatus === "active".
 * New unlimited = an active ScoreSubscriber (email-keyed, no Stripe sub →
 * comped, never billed). Matches the promise on /the-new-mixreflect.
 *
 * Dry-run by default. Pass --apply to write.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const APPLY = process.argv.includes("--apply");
const KRIS = "kris.engelhardt4@gmail.com";

async function main() {
  // 1. Check kris specifically.
  const krisUser = await prisma.user.findFirst({
    where: { email: { equals: KRIS, mode: "insensitive" } },
    select: { email: true, ArtistProfile: { select: { subscriptionStatus: true } } },
  });
  const krisSub = await prisma.scoreSubscriber.findUnique({
    where: { email: KRIS }, select: { status: true },
  });
  console.log(`\n[kris] account: ${krisUser?.email ?? "NOT FOUND"}`);
  console.log(`[kris] classic Pro status: ${krisUser?.ArtistProfile?.subscriptionStatus ?? "none"}`);
  console.log(`[kris] new unlimited (ScoreSubscriber): ${krisSub?.status ?? "none"}`);

  // 2. All active Classic Pro users.
  const pros = await prisma.artistProfile.findMany({
    where: { subscriptionStatus: "active" },
    select: { artistName: true, User: { select: { email: true } } },
  });
  const proEmails = pros
    .map((p) => p.User?.email?.trim().toLowerCase())
    .filter((e): e is string => !!e);

  const targets = Array.from(new Set([...proEmails, KRIS]));
  const existing = await prisma.scoreSubscriber.findMany({
    where: { email: { in: targets } },
    select: { email: true, status: true },
  });
  const existingActive = new Set(
    existing.filter((e) => e.status === "active").map((e) => e.email)
  );

  console.log(`\nactive Classic Pro accounts: ${proEmails.length}`);
  console.log(`targets (incl. kris): ${targets.length}`);
  console.log(`already active on unlimited: ${existingActive.size}`);
  console.log(`to migrate: ${targets.filter((e) => !existingActive.has(e)).length}`);
  targets.forEach((e) => console.log(`  - ${e}${existingActive.has(e) ? " (already active)" : ""}`));

  if (!APPLY) {
    console.log("\nDRY RUN — re-run with --apply to write these ScoreSubscriber rows.");
    await prisma.$disconnect();
    return;
  }

  let migrated = 0;
  for (const email of targets) {
    await prisma.scoreSubscriber.upsert({
      where: { email },
      create: { email, status: "active" },
      update: { status: "active" },
    });
    migrated++;
  }
  console.log(`\n✓ migrated ${migrated} email(s) to active unlimited.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERR", e instanceof Error ? e.message : e);
  process.exit(1);
});
