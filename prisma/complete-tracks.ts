import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

async function fixTrack(trackId: string, label: string) {
  // Count actual completed reviews
  const completedCount = await prisma.review.count({
    where: { trackId, status: "COMPLETED" },
  });

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
  });

  console.log(`\n${label}: "${track?.title}"`);
  console.log(`  DB reviewsCompleted: ${track?.reviewsCompleted}, Actual completed reviews: ${completedCount}, Requested: ${track?.reviewsRequested}`);

  const isComplete = completedCount >= (track?.reviewsRequested ?? 0);

  const updated = await prisma.track.update({
    where: { id: trackId },
    data: {
      reviewsCompleted: completedCount,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      ...(isComplete ? { completedAt: new Date() } : {}),
    },
  });

  console.log(`  → Status: ${updated.status}, reviewsCompleted: ${updated.reviewsCompleted}/${updated.reviewsRequested}`);
}

async function main() {
  await fixTrack("cmlvy5mmv000004jry74wdg4w", "Repressed Reprise");
  await fixTrack("cmlwpin2v000004lg6u4joryi", "Beacon of the end");
  console.log("\n✅ Done");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
