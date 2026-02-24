import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const SEED_REVIEWERS = [
  { email: "marcus.hardriff@gmail.com", name: "Marcus Rivera" },
  { email: "jenny.rawmix@gmail.com", name: "Jenny Carr" },
];

const reviews = [
  {
    // Marcus — direct metal listener, personal framing, "For me..."
    bestPart:
      "The guitar tone is genuinely heavy and it fits the soundtrack vibe perfectly. You can feel the intention behind it and it actually works.",
    biggestWeaknessSpecific:
      "For me the middle section loses a bit of steam. The track hits hard at the start and end but there's a stretch in the middle where the momentum kind of plateaus. It doesnt ruin it at all but that section could use a bit more urgency to keep the intensity consistent throughout.",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,           // RELEASE_READY
    vocalScore: 4,                // vocals present and clear
    originalityScore: 5,          // STRONG_HOOK = 5
    qualityLevel: "RELEASE_READY" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Jenny — chatty, "Also" connectors, warmer, ends with encouragement
    bestPart:
      "The vocals actually surprised me in a good way. They cut through the heaviness really nicely and give the whole thing a human anchor you can hold onto.",
    biggestWeaknessSpecific:
      "I think the emotional arc could be pushed a bit futher. Like the track builds well but I never quite got that final payoff moment I was waiting for — it kind of resolves before fully releasing the tension. Also the mid section drags slightly before the track picks back up. But overall its a solid piece of work and the concept is cool!",
    firstImpression: "DECENT" as const,
    productionScore: 3,           // ALMOST_THERE
    vocalScore: 4,
    originalityScore: 3,          // DECENT = 3
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  // Find track by title (no artist email needed)
  const track = await prisma.track.findFirst({
    where: { title: { contains: "Grit It Takes", mode: "insensitive" } },
  });

  if (!track) {
    throw new Error("Track 'The Grit It Takes' not found");
  }

  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  // Create / find reviewers
  const reviewerProfiles: { id: string }[] = [];
  for (const { email, name } of SEED_REVIEWERS) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { ReviewerProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          emailVerified: new Date(),
          isReviewer: true,
          ReviewerProfile: { create: { tier: "NORMAL" } },
        },
        include: { ReviewerProfile: true },
      });
      console.log(`Created reviewer: ${name}`);
    } else {
      console.log(`Found reviewer: ${name}`);
    }

    if (user.ReviewerProfile) reviewerProfiles.push(user.ReviewerProfile);
  }

  if (reviewerProfiles.length < reviews.length) {
    throw new Error("Not enough reviewer profiles created");
  }

  const newCompleted = (track.reviewsCompleted ?? 0) + reviews.length;
  const isComplete = newCompleted >= (track.reviewsRequested ?? 5);

  await prisma.$transaction([
    ...reviews.map((r, i) =>
      prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewerProfiles[i]!.id,
          status: "COMPLETED",
          listenDuration: 160 + Math.floor(Math.random() * 60),
          firstImpression: r.firstImpression,
          productionScore: r.productionScore,
          vocalScore: r.vocalScore,
          originalityScore: r.originalityScore,
          qualityLevel: r.qualityLevel,
          wouldListenAgain: r.wouldListenAgain,
          bestPart: r.bestPart,
          biggestWeaknessSpecific: r.biggestWeaknessSpecific,
          weakestPart: r.biggestWeaknessSpecific,
          lowEndClarity: r.lowEndClarity,
          vocalClarity: r.vocalClarity,
          highEndQuality: r.highEndQuality,
          stereoWidth: r.stereoWidth,
          dynamics: r.dynamics,
          tooRepetitive: r.tooRepetitive,
          trackLength: r.trackLength,
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId: `inj${i}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        },
      })
    ),
    prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: { increment: reviews.length },
        status: isComplete ? "COMPLETED" : "IN_PROGRESS",
        ...(isComplete ? { completedAt: new Date() } : {}),
      },
    }),
  ]);

  console.log(`\n✅ Injected ${reviews.length} reviews for "${track.title}"`);
  console.log(`   Track is now: ${isComplete ? "COMPLETED" : "IN_PROGRESS"} (${newCompleted}/${track.reviewsRequested})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
