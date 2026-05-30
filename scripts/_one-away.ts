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
  const tracks = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      reviewsRequested: number;
      reviewsCompleted: number;
    }[]
  >`
    SELECT id, title, "reviewsRequested", "reviewsCompleted"
    FROM "Track"
    WHERE status = 'IN_PROGRESS'
      AND "reviewsCompleted" = "reviewsRequested" - 1
    ORDER BY "reviewsCompleted" DESC
  `;

  if (tracks.length === 0) {
    console.log("No tracks are one review away from completion.");
    return;
  }

  console.log(`${tracks.length} track(s) need exactly 1 more review:\n`);
  for (const t of tracks) {
    console.log(`  ${t.title}`);
    console.log(`    id: ${t.id}`);
    console.log(
      `    progress: ${t.reviewsCompleted}/${t.reviewsRequested}\n`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
