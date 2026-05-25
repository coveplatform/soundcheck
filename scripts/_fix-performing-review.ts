import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const TRACK_ID = "cmonieux5000304juqks9zw7o";
const SEED_EMAIL = "caseymorgan@seed.mixreflect.com";

const newFeedback =
  "on my setup this comes across a bit harsh in the upper mids - something around 3-5k feels like its sitting a little hot in the mix. a light eq pass in that range would smooth it out and open things up a bit. overall solid production tho, nothing major holding it back";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: SEED_EMAIL },
    select: { ArtistProfile: { select: { id: true } } },
  });
  const profileId = user?.ArtistProfile?.id;
  if (!profileId) throw new Error("Seed profile not found");

  const review = await prisma.review.findFirst({
    where: { trackId: TRACK_ID, peerReviewerArtistId: profileId },
  });
  if (!review) throw new Error("Review not found");

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { biggestWeaknessSpecific: newFeedback, weakestPart: newFeedback },
  });

  console.log("Updated review:", updated.id);
  console.log("New feedback:", updated.biggestWeaknessSpecific);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
