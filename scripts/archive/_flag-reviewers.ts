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

async function main() {
  // Optionally flag a specific account passed as an arg (e.g. your own email).
  const extra = process.argv[2];
  if (extra) {
    const u = await prisma.user.updateMany({
      where: { email: extra },
      data: { isScoreReviewer: true },
    });
    console.log(`flagged "${extra}": ${u.count} user(s)`);
  }

  // Build a pool of 5 from internal seed accounts (not real users).
  const seeds = await prisma.user.findMany({
    where: { email: { endsWith: "@seed.mixreflect.com" }, isScoreReviewer: false },
    select: { id: true, email: true },
    take: 5,
  });
  if (seeds.length) {
    await prisma.user.updateMany({
      where: { id: { in: seeds.map((s) => s.id) } },
      data: { isScoreReviewer: true },
    });
  }

  const total = await prisma.user.count({ where: { isScoreReviewer: true } });
  console.log(`flagged ${seeds.length} seed reviewers this run.`);
  console.log(`total score reviewers now: ${total}`);
  const all = await prisma.user.findMany({
    where: { isScoreReviewer: true },
    select: { email: true },
    take: 10,
  });
  all.forEach((u) => console.log("  -", u.email));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
