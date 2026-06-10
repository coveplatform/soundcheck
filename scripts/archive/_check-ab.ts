import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  const tracks = await prisma.track.findMany({
    where: { isAbTest: true },
    select: { id: true, title: true, isAbTest: true, abTestPrimaryTrackId: true, artistId: true },
  });
  console.log("AB tracks:", tracks.length);
  tracks.forEach(t => console.log(` id=${t.id} primary=${t.abTestPrimaryTrackId ?? "IS_PRIMARY"} | ${t.title.slice(0,50)}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
