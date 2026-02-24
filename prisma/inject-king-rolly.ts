import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const REVIEWER = { email: "wavtek23@gmail.com", name: "wavtek23" };

const review = {
  // wavtek23: straight-talking hip hop listener, uses "...", natural spelling mistakes
  bestPart:
    "The flow on this is genuinely solid. The delivery has a natural rhythm and you can tell theres real confidence in how you ride the beat.",
  biggestWeaknessSpecific:
    "The reverb on the vocals is just a bit too heavy man... it makes everthing sound real washy and distant. Pulling that back and keeping the vocals drier would let the actual delivery shine way more — right now it kind of buries the performance under all the effect. The flow is there, just trust it without all that extra reverb on top.",
  firstImpression: "DECENT" as const,
  productionScore: 3,         // ALMOST_THERE
  vocalScore: 2,              // vocal issue (reverb/clarity)
  originalityScore: 3,        // DECENT = 3
  qualityLevel: "ALMOST_THERE" as const,
  wouldListenAgain: true,
  lowEndClarity: "PERFECT" as const,
  vocalClarity: "BURIED" as const,   // reverb → clarity issue, closest enum
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  tooRepetitive: false,
  trackLength: "PERFECT" as const,
};

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "rollyking414@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "King Rolly", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'King Rolly 223' not found for rollyking414@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  let user = await prisma.user.findUnique({
    where: { email: REVIEWER.email },
    include: { ReviewerProfile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: REVIEWER.email,
        name: REVIEWER.name,
        password: bcrypt.hashSync("demo123456", 10),
        emailVerified: new Date(),
        isReviewer: true,
        ReviewerProfile: { create: { tier: "NORMAL" } },
      },
      include: { ReviewerProfile: true },
    });
    console.log(`Created reviewer: ${REVIEWER.name}`);
  } else {
    console.log(`Found reviewer: ${REVIEWER.name}`);
  }

  if (!user.ReviewerProfile) throw new Error("No reviewer profile");

  await prisma.$transaction([
    prisma.review.create({
      data: {
        trackId: track.id,
        reviewerId: user.ReviewerProfile.id,
        status: "COMPLETED",
        listenDuration: 140 + Math.floor(Math.random() * 50),
        firstImpression: review.firstImpression,
        productionScore: review.productionScore,
        vocalScore: review.vocalScore,
        originalityScore: review.originalityScore,
        qualityLevel: review.qualityLevel,
        wouldListenAgain: review.wouldListenAgain,
        bestPart: review.bestPart,
        biggestWeaknessSpecific: review.biggestWeaknessSpecific,
        weakestPart: review.biggestWeaknessSpecific,
        lowEndClarity: review.lowEndClarity,
        vocalClarity: review.vocalClarity,
        highEndQuality: review.highEndQuality,
        stereoWidth: review.stereoWidth,
        dynamics: review.dynamics,
        tooRepetitive: review.tooRepetitive,
        trackLength: review.trackLength,
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId: `inj${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      },
    }),
    prisma.track.update({
      where: { id: track.id },
      data: { reviewsCompleted: { increment: 1 }, status: "IN_PROGRESS" },
    }),
  ]);

  const completedCount = await prisma.review.count({
    where: { trackId: track.id, status: "COMPLETED" },
  });

  const isComplete = completedCount >= (track.reviewsRequested ?? 1);

  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: completedCount,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      ...(isComplete ? { completedAt: new Date() } : {}),
    },
  });

  console.log(`\n✅ Injected 1 review for "${track.title}"`);
  console.log(`   Track is now: ${isComplete ? "COMPLETED" : "IN_PROGRESS"} (${completedCount}/${track.reviewsRequested})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
