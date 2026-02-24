import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: "rellval06@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
          },
        },
      },
    },
  });
  console.log(JSON.stringify(u?.ArtistProfile?.Track, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
