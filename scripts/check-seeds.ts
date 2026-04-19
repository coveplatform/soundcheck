import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });

async function main() {
  const count = await prisma.artistProfile.count({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
  });
  console.log("Total seed reviewers:", count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
