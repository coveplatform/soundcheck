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
  // Owner of Scottsville Road
  const track = await prisma.track.findUnique({
    where: { id: "cmpt90sur000304jp6tmdwyp0" },
    include: {
      ArtistProfile: { select: { artistName: true, User: { select: { email: true } } } },
      ReviewQueue: {
        include: { ArtistProfile: { select: { artistName: true, User: { select: { email: true } } } } },
      },
    },
  });
  console.log("=== Scottsville Road track ===");
  console.log(JSON.stringify(track, null, 2));

  // Kris's review queue
  const kris = await prisma.artistProfile.findFirst({
    where: { User: { email: "kris.engelhardt4@gmail.com" } },
    select: { id: true },
  });
  if (kris) {
    const queue = await prisma.reviewQueue.findMany({
      where: { reviewerId: kris.id },
      include: { Track: { select: { id: true, title: true, status: true, createdAt: true } } },
      orderBy: { assignedAt: "desc" },
    });
    console.log("\n=== Kris's review queue ===");
    console.log(JSON.stringify(queue, null, 2));
  }

  // legendaryknightsoul — what did they submit / own
  const lk = await prisma.user.findFirst({
    where: { email: "legendaryknightsoul@gmail.com" },
    include: {
      ArtistProfile: {
        include: { Track: { select: { id: true, title: true, status: true, createdAt: true, reviewsRequested: true, reviewsCompleted: true } } },
      },
    },
  });
  console.log("\n=== legendaryknightsoul user + tracks ===");
  console.log(JSON.stringify(lk, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
