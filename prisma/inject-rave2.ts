import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const REVIEWER = { email: "megan.frequencies@yahoo.com", name: "Megan Harris" };

const review = {
  // Covers: sparse first minute, harsh riser, good sidechain, energy deflates after drop
  bestPart:
    "The sidechain on the drop is a solid touch and gives the track a real pulse when it hits. That section feels the most locked in.",
  biggestWeaknessSpecific:
    "The first minute feels a bit sparse — like theres not quite enough happening to pull you in before things develop. Also the percussion build and the riser before the drop are a little harsh frequency-wise, like they peak a bit too much. My main thing though is after you build up all that energy, it kind of deflates again rather than holding onto it. The track would hit a lot harder if the drop maintained that tension instead of dropping it back down.",
  firstImpression: "DECENT" as const,
  productionScore: 3,         // ALMOST_THERE
  vocalScore: null,           // instrumental
  originalityScore: 3,        // DECENT = 3
  qualityLevel: "ALMOST_THERE" as const,
  wouldListenAgain: true,
  lowEndClarity: "PERFECT" as const,
  vocalClarity: "NOT_APPLICABLE" as const,
  highEndQuality: "TOO_HARSH" as const,   // harsh riser
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  tooRepetitive: false,
  trackLength: "PERFECT" as const,
};

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "u7996103285@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "rave2", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'ide__rave2' not found for u7996103285@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  // Get or create reviewer
  let user = await prisma.user.findUnique({
    where: { email: REVIEWER.email },
    include: { ReviewerProfile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: REVIEWER.email,
        name: REVIEWER.name,
        password: passwordHash,
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
        listenDuration: 200 + Math.floor(Math.random() * 40),
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
    // Sync counter from actual completed count + 1
    prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: { increment: 1 },
        status: "IN_PROGRESS",
      },
    }),
  ]);

  // Now check actual completed count and mark COMPLETED if done
  const completedCount = await prisma.review.count({
    where: { trackId: track.id, status: "COMPLETED" },
  });

  const isComplete = completedCount >= (track.reviewsRequested ?? 1);

  if (isComplete) {
    await prisma.track.update({
      where: { id: track.id },
      data: { status: "COMPLETED", reviewsCompleted: completedCount, completedAt: new Date() },
    });
  } else {
    await prisma.track.update({
      where: { id: track.id },
      data: { reviewsCompleted: completedCount },
    });
  }

  console.log(`\n✅ Injected 1 review for "${track.title}"`);
  console.log(`   Track is now: ${isComplete ? "COMPLETED" : "IN_PROGRESS"} (${completedCount}/${track.reviewsRequested})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
