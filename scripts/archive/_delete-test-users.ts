import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const EMAILS = [
  "testkris@kris.com",
  "kris.engelhardt5@gmail.com",
  "dog.dog@dog.com",
  "cheesetester@cheese.clm",
];

async function main() {
  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    if (!user) {
      console.log(`[SKIP] ${email} — not found`);
      continue;
    }
    await prisma.user.delete({ where: { email } });
    console.log(`[DELETED] ${email} (${user.name ?? "no name"}, id: ${user.id})`);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
