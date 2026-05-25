import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });

async function main() {
  const emails = ["djjcar@gmail.com", "ilyaphoenixmusic@gmail.com"];
  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { ArtistProfile: { include: { Track: { select: { title: true, status: true } } } } },
    });
    console.log(`\n${email}`);
    user?.ArtistProfile?.Track.forEach(t => console.log(`  [${t.status}] "${t.title}"`));
  }
}

main().then(async () => { await prisma.$disconnect(); }).catch(console.error);
