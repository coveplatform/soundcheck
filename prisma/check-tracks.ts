import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
    include: {
      artist: true,
      reviews: true,
    },
  });

  console.log("Tracks needing reviews:");
  for (const t of tracks) {
    console.log("- ID:", t.id);
    console.log("  Title:", t.title);
    console.log("  Artist:", t.artist?.artistName);
    console.log("  Package:", t.packageType);
    console.log("  Reviews:", t.reviewsCompleted + "/" + t.reviewsRequested);
    console.log("  Existing reviews:", t.reviews.length);
    console.log("  Status:", t.status);
    console.log("");
  }

  const reviewers = await prisma.reviewerProfile.findMany({
    include: { user: true },
    take: 30,
  });

  console.log("\nExisting reviewers:");
  for (const r of reviewers) {
    console.log("- " + r.user.name + " (" + r.user.email + ") - ID: " + r.id);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
