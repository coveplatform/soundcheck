import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  await Promise.all([
    prisma.track.update({ where: { id: "cmpsdjrlp00007wvihtpygx1u" }, data: { artworkUrl: "https://picsum.photos/seed/versiona/400/400" } }),
    prisma.track.update({ where: { id: "cmpsdjrq600017wvil7s3n096" }, data: { artworkUrl: "https://picsum.photos/seed/versionb/400/400" } }),
  ]);
  console.log("done");
}
main().catch(console.error).finally(() => prisma.$disconnect());
