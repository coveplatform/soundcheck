import { prisma } from "../../src/lib/prisma";
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "kris.engelhardt4@gmail.com" },
    select: { ArtistProfile: { select: { id: true, reviewCredits: true, subscriptionStatus: true } } }
  });
  const p = user!.ArtistProfile!;
  console.log("before:", p.reviewCredits, "credits, status:", p.subscriptionStatus);
  await prisma.artistProfile.update({
    where: { id: p.id },
    data: { reviewCredits: 0, subscriptionStatus: null }
  });
  console.log("set: 0 credits, status null");
  await prisma.$disconnect();
}
main().catch(console.error);
