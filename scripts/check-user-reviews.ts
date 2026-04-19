import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("No DATABASE_URL found");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const EMAIL = "tconn66@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL.toLowerCase() },
    select: { id: true, email: true, createdAt: true },
  });

  if (!user) {
    console.log(`No user found for ${EMAIL}`);
    return;
  }

  console.log(`\nUser: ${user.email} (id: ${user.id}, joined: ${user.createdAt.toISOString()})`);

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, subscriptionStatus: true, reviewCredits: true },
  });

  if (!artistProfile) {
    console.log("No artist profile found.");
    return;
  }

  console.log(`Artist profile: ${artistProfile.id} | sub: ${artistProfile.subscriptionStatus ?? "free"} | credits: ${artistProfile.reviewCredits}`);

  const tracks = await prisma.track.findMany({
    where: { artistId: artistProfile.id },
    include: {
      Payment: { select: { status: true, amount: true } },
      Review: {
        select: {
          id: true,
          status: true,
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (tracks.length === 0) {
    console.log("No tracks found.");
    return;
  }

  for (const track of tracks) {
    console.log(`\n── Track: "${track.title}" (id: ${track.id})`);
    console.log(`   Status: ${track.status} | reviewsRequested: ${track.reviewsRequested} | reviewsCompleted: ${track.reviewsCompleted}`);
    console.log(`   Payment: ${track.Payment?.status ?? "none"} (amount: ${track.Payment?.amount ?? 0})`);
    console.log(`   Reviews in DB: ${track.Review.length}`);

    if (track.Review.length === 0) {
      console.log("   (no reviews)");
    } else {
      for (const r of track.Review) {
        console.log(`     - [${r.status}] id: ${r.id} | countsCompletion: ${r.countsTowardCompletion} | countsAnalytics: ${r.countsTowardAnalytics} | updated: ${r.updatedAt.toISOString()}`);
      }
    }

    const completedCount = track.Review.filter(r => r.status === "COMPLETED").length;
    console.log(`   → COMPLETED reviews visible to user: ${completedCount}`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
