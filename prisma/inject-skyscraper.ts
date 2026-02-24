import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "romeosoyyo132@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "SKYSCRAPER", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'SKYSCRAPER' not found for romeosoyyo132@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  // Marcus Dean — sample-head / break music fan, genuinely hyped, "..." energy
  let reviewerUser = await prisma.user.findUnique({
    where: { email: "marcus.breakhead@gmail.com" },
    include: { ReviewerProfile: true },
  });

  if (!reviewerUser) {
    reviewerUser = await prisma.user.create({
      data: {
        email: "marcus.breakhead@gmail.com",
        name: "Marcus Dean",
        password: passwordHash,
        emailVerified: new Date(),
        isReviewer: true,
        ReviewerProfile: { create: { tier: "NORMAL" } },
      },
      include: { ReviewerProfile: true },
    });
    console.log("Created reviewer: Marcus Dean");
  } else {
    console.log("Found reviewer: Marcus Dean");
  }

  const reviewerProfile = reviewerUser.ReviewerProfile!;
  const newCompleted = (track.reviewsCompleted ?? 0) + 1;
  const isComplete = newCompleted >= (track.reviewsRequested ?? 1);

  await prisma.$transaction([
    prisma.review.create({
      data: {
        trackId: track.id,
        reviewerId: reviewerProfile.id,
        status: "COMPLETED",
        listenDuration: 220 + Math.floor(Math.random() * 60),
        firstImpression: "STRONG_HOOK",
        productionScore: 5,              // PROFESSIONAL
        vocalScore: null,                // instrumental
        originalityScore: 5,             // STRONG_HOOK = 5
        qualityLevel: "PROFESSIONAL",
        wouldListenAgain: true,
        bestPart:
          "That break at 3:02 is genuinely something special... it hits in a way that's completely consuming and the way the whole track builds to that moment is so well handled. The groove throughout is incredible and the samples are beautiful. This is the kind of track you put on and just let wash over you.",
        biggestWeaknessSpecific:
          "Honestly this is hard to critique because it's so well put together. The only thing I'd say is the very opening takes a little time before it fully reveals itself — like it earns the listener's patience but someone less familiar with this style might not stick around long enough to get to where it really opens up. Maybe just a slightly stronger hook in the first 30 seconds to pull people in faster. But when it does hit... wow.",
        weakestPart:
          "Honestly this is hard to critique because it's so well put together. The only thing I'd say is the very opening takes a little time before it fully reveals itself — like it earns the listener's patience but someone less familiar with this style might not stick around long enough to get to where it really opens up. Maybe just a slightly stronger hook in the first 30 seconds to pull people in faster. But when it does hit... wow.",
        lowEndClarity: "PERFECT",
        vocalClarity: "NOT_APPLICABLE",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        tooRepetitive: false,
        trackLength: "PERFECT",
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId: `inj0${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      },
    }),
    prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: { increment: 1 },
        status: isComplete ? "COMPLETED" : "IN_PROGRESS",
        ...(isComplete ? { completedAt: new Date() } : {}),
      },
    }),
  ]);

  console.log(`\n✅ Injected 1 review for "${track.title}"`);
  console.log(`   Track is now: ${isComplete ? "COMPLETED" : "IN_PROGRESS"} (${newCompleted}/${track.reviewsRequested})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
