import { prisma } from "../src/lib/prisma";
async function main() {
  // Check track + reviews
  const track = await prisma.track.findUnique({
    where: { id: "cmk7ph6ql000004l8bzi302sx" },
    select: {
      id: true, title: true, status: true, reviewsRequested: true, reviewsCompleted: true,
      ArtistProfile: { select: { id: true, userId: true, artistName: true } },
      Review: { select: { id: true, status: true } },
    },
  });
  console.log("Track:", JSON.stringify(track, null, 2));

  // Check user simlimsd3's artist profile and tracks
  const simli = await prisma.user.findUnique({
    where: { email: "simlimsd3@gmail.com" },
    select: {
      id: true,
      ArtistProfile: {
        select: {
          id: true,
          Track: { select: { id: true, title: true, status: true }, take: 5 },
        },
      },
    },
  });
  console.log("\nSimli user+tracks:", JSON.stringify(simli, null, 2));

  await prisma.$disconnect();
}
main();
