import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("No database URL found in environment variables");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// Generate a short, URL-safe share ID (8 characters)
function generateShareId(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}

async function backfillShareIds() {
  console.log("Finding completed reviews without shareId...");

  const reviewsWithoutShareId = await prisma.review.findMany({
    where: {
      status: "COMPLETED",
      shareId: null,
    },
    select: {
      id: true,
      track: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log(`Found ${reviewsWithoutShareId.length} reviews to update`);

  if (reviewsWithoutShareId.length === 0) {
    console.log("No reviews need updating!");
    return;
  }

  let updated = 0;
  for (const review of reviewsWithoutShareId) {
    const shareId = generateShareId();

    await prisma.review.update({
      where: { id: review.id },
      data: { shareId },
    });

    updated++;
    console.log(`[${updated}/${reviewsWithoutShareId.length}] Updated review for "${review.track.title}" with shareId: ${shareId}`);
  }

  console.log(`\nBackfill complete! Updated ${updated} reviews.`);
}

backfillShareIds()
  .catch((e) => {
    console.error("Error during backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
