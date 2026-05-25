import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });

async function main() {
  const tracks = await prisma.track.findMany({
    where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
    include: { ArtistProfile: { include: { User: { select: { email: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const pending = tracks.filter(t => t.reviewsCompleted < t.reviewsRequested);
  pending.forEach(t => {
    console.log(`{ email: "${t.ArtistProfile.User.email}", title: "${t.title.replace(/"/g, '\\"')}", count: 1 },`);
  });
}

main().then(async () => { await prisma.$disconnect(); }).catch(console.error);
