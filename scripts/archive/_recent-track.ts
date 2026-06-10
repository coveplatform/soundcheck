import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("No DATABASE_URL found");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmounolqs000004lag5zjefhj" },
    select: { email: true, name: true }
  });
  console.log(JSON.stringify(user, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
