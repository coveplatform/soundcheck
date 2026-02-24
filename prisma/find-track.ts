import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const tracks = await prisma.track.findMany({
    where: { sourceUrl: { contains: "if-this-is-it", mode: "insensitive" } },
    select: {
      id: true, title: true, status: true,
      reviewsCompleted: true, reviewsRequested: true,
      ArtistProfile: { select: { User: { select: { email: true } } } }
    }
  });
  console.log("By URL:", JSON.stringify(tracks, null, 2));

  const byId = await prisma.track.findFirst({
    where: { OR: [{ id: "D6GWrbKErvW33MjOz7" }, { trackShareId: "D6GWrbKErvW33MjOz7" }] },
    select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true }
  });
  console.log("By ID/shareId:", byId ?? "not found");

  const tobeUser = await prisma.user.findUnique({
    where: { email: "tobedarid@gmail.com" },
    include: { ArtistProfile: { include: { Track: { select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true } } } } }
  });
  console.log("tobedarid user:", JSON.stringify(tobeUser?.ArtistProfile?.Track, null, 2));

  await prisma.$disconnect();
}
main().catch(console.error);
