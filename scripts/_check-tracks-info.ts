import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });

const ids = [
  "cmonieux5000304juqks9zw7o",
  "cmphpero4000004jucji4huks",
  "cmpjj3hlk000404l4zrnw8j4k",
  "cmpk72fg9000004lg2xk3bu0q",
  "cmpl7pl8n000304l1tfdn7pw4",
  "cmpm1ykl3000004ieqmo8spxl",
  "cmpm5m1nh000304lcpcrsiz79",
];

async function main() {
  for (const id of ids) {
    const t = await prisma.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        reviewsCompleted: true,
        reviewsRequested: true,
        Genre: { select: { name: true } },
        Review: { select: { peerReviewerArtistId: true } },
        ArtistProfile: { select: { artistName: true, User: { select: { email: true } } } },
      },
    });
    if (!t) { console.log(id + ": NOT FOUND"); continue; }
    const usedSeeds = t.Review.map(r => r.peerReviewerArtistId).filter(Boolean);
    console.log(`\n── ${t.title} (${t.id})`);
    console.log(`   Artist: ${t.ArtistProfile?.artistName} <${t.ArtistProfile?.User?.email}>`);
    console.log(`   Progress: ${t.reviewsCompleted}/${t.reviewsRequested}`);
    console.log(`   Genres: ${t.Genre.map(g => g.name).join(", ") || "none"}`);
    console.log(`   Used seed IDs (${usedSeeds.length}): ${usedSeeds.join(", ") || "none"}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
