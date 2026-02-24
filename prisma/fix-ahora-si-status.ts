import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const track = await prisma.track.findFirst({
    where: { sourceUrl: { contains: "ahora-si", mode: "insensitive" } },
    select: { id: true, title: true, reviewsCompleted: true, reviewsRequested: true, status: true },
  });

  if (!track) throw new Error("Track not found");
  console.log("Before:", track);

  await prisma.track.update({
    where: { id: track.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  console.log(`✅ "${track.title}" → COMPLETED (${track.reviewsCompleted}/${track.reviewsRequested})`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
