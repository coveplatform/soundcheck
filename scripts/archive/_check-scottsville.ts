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

async function main() {
  const tracks = await prisma.track.findMany({
    where: { title: { contains: "scottsville", mode: "insensitive" } },
    select: {
      id: true,
      title: true,
      status: true,
      reviewsRequested: true,
      reviewsCompleted: true,
      createdAt: true,
      _count: { select: { Review: true } },
    },
  });
  console.log(JSON.stringify(tracks, null, 2));

  for (const t of tracks) {
    const reviews = await prisma.review.findMany({
      where: { trackId: t.id },
      select: { id: true, status: true, createdAt: true },
    });
    console.log(`\n=== Reviews for "${t.title}" (${t.id}) ===`);
    console.log(`total review rows: ${reviews.length}`);
    const byStatus = reviews.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    console.log("by status:", JSON.stringify(byStatus));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
