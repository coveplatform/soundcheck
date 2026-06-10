import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const IDS = ["cmq06ns30000104jp4zk603zr", "cmppdfcmu000nccvifylmvp7e"];

async function main() {
  for (const id of IDS) {
    const t = await prisma.track.findUnique({ where: { id } });
    console.log("\n=== " + id + " ===");
    console.log(JSON.stringify(t, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
