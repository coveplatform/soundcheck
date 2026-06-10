import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT t.id, t.title, t.status, t."reviewsCompleted", t."reviewsRequested"
    FROM "Track" t
    JOIN "ArtistProfile" ap ON ap.id = t."artistId"
    JOIN "User" u ON u.id = ap."userId"
    WHERE u.email = 'kentoraptor@gmail.com'
  `;
  const ap = await prisma.$queryRaw<any[]>`
    SELECT ap."totalPeerReviews", ap."reviewCredits", ap."artistName"
    FROM "ArtistProfile" ap
    JOIN "User" u ON u.id = ap."userId"
    WHERE u.email = 'kentoraptor@gmail.com'
  `;
  console.log("Artist name:", ap[0]?.artistName);
  console.log("totalPeerReviews (reviews given by them):", ap[0]?.totalPeerReviews);
  console.log("reviewCredits:", ap[0]?.reviewCredits);
  console.log("\nTracks:");
  for (const t of rows) {
    console.log(`  [${t.status}] "${t.title}" — ${t.reviewsCompleted}/${t.reviewsRequested}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
