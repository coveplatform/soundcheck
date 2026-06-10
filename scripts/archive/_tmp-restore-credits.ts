import { prisma } from "../../src/lib/prisma";
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "kris.engelhardt4@gmail.com" },
    select: { ArtistProfile: { select: { id: true } } }
  });
  await prisma.artistProfile.update({
    where: { id: user!.ArtistProfile!.id },
    data: { reviewCredits: 48, subscriptionStatus: "active" }
  });
  console.log("restored: 48 credits, status active");
  await prisma.$disconnect();
}
main().catch(console.error);
