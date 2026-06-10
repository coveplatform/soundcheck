import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
async function main() {
  const ids = ["cmn7b1010000204kvxg5zaj0d", "cmn8lao04000004joh49ks62v", "cmn9gfm41000304l5x8pl0y65"];
  for (const id of ids) {
    const r = await prisma.review.findUnique({ where: { id }, select: { Track: { select: { title: true, sourceType: true, sourceUrl: true, artworkUrl: true } } } });
    console.log(id, "→", r?.Track?.sourceType, "| art:", !!r?.Track?.artworkUrl, "|", r?.Track?.title);
  }
}
main().finally(() => prisma.$disconnect());
