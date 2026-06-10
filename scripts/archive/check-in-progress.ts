import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const tracks = await prisma.track.findMany({
    where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
    include: {
      ArtistProfile: { include: { User: { select: { email: true } } } },
      Review: { select: { id: true, status: true, countsTowardCompletion: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${tracks.length} QUEUED/IN_PROGRESS tracks:\n`);
  for (const t of tracks) {
    const completed = t.Review.filter(r => r.status === "COMPLETED" && r.countsTowardCompletion).length;
    const remaining = t.reviewsRequested - completed;
    console.log(`── "${t.title}" (${t.id})`);
    console.log(`   Artist: ${t.ArtistProfile.User?.email}`);
    console.log(`   Status: ${t.status} | ${completed}/${t.reviewsRequested} done | need ${remaining} more`);
    console.log(`   Package: ${t.packageType} | Reviews in DB: ${t.Review.length}`);
    console.log();
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
