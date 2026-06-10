import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const TRACKS = ["cmq06ns30000104jp4zk603zr", "cmppdfcmu000nccvifylmvp7e"];

async function main() {
  const seeds = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, artistName: true, User: { select: { email: true } } },
    orderBy: { User: { email: "asc" } },
  });
  console.log(`${seeds.length} seed profiles\n`);

  for (const trackId of TRACKS) {
    const used = await prisma.review.findMany({
      where: { trackId, peerReviewerArtistId: { not: null } },
      select: { peerReviewerArtistId: true },
    });
    const usedSet = new Set(used.map((u) => u.peerReviewerArtistId));
    const free = seeds.filter((s) => !usedSet.has(s.id));
    console.log(`=== ${trackId} ===`);
    console.log(`  used seeds: ${usedSet.size}, free: ${free.length}`);
    console.log(`  first 3 free: ${free.slice(0, 3).map((s) => `${s.artistName} <${s.User.email}>`).join(" | ")}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
