import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const REVIEWERS = [
  {
    email: "jake.soundcheck@gmail.com",
    name: "jakebeats_",
    review: {
      // Jake: casual, uses "...", spelling mistakes, enthusiastic
      bestPart:
        "That hi hat pattern is genuinely crispy man... the groove locks in real nice and gives the whole thing a cool bounce to it.",
      biggestWeaknessSpecific:
        "Biggest thing for me is the vocals feel a bit muffled in the mix... like I can hear you're saying somthing good but they kinda get swallowed up by the production. If you brought the vocals up a touch it would slap way harder. The beat and the instrumentation are really solid though so its mostly just a mix thing.",
      firstImpression: "DECENT" as const,
      productionScore: 3,         // ALMOST_THERE
      vocalScore: 2,              // vocals buried
      originalityScore: 3,        // DECENT = 3
      qualityLevel: "ALMOST_THERE" as const,
      wouldListenAgain: true,
      lowEndClarity: "PERFECT" as const,
      vocalClarity: "BURIED" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      tooRepetitive: false,
      trackLength: "PERFECT" as const,
    },
  },
  {
    email: "carlos.wav@hotmail.com",
    name: "cxrlos_wav",
    review: {
      // Carlos: brief, direct, hip hop head, spelling mistakes
      bestPart:
        "The hi hat groove is well constructed on this. Gives it real movement and the electronic feel is cool — nice combination.",
      biggestWeaknessSpecific:
        "Vocals are definately getting burried in the mix. You can feel theres a good performance there but they sit too low and sound muffled. Turn em up and let them cut through properly. The instrumentation is nice otherwise, track has a solid foundation. Just needs that mix tweak.",
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: 2,
      originalityScore: 3,
      qualityLevel: "ALMOST_THERE" as const,
      wouldListenAgain: true,
      lowEndClarity: "PERFECT" as const,
      vocalClarity: "BURIED" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      tooRepetitive: false,
      trackLength: "PERFECT" as const,
    },
  },
  {
    email: "tanya.mixhead@gmail.com",
    name: "tanyamix",
    review: {
      // Tanya: chatty, encouraging, uses "!" and casual openers
      bestPart:
        "Yehhh this is good! The originality on this got me straight away — it's got its own sound and the whole vibe feels fresh and different.",
      biggestWeaknessSpecific:
        "Ah the main thing I noticed is the vocals sound a little muffled in the mix. The delivery sounds good but they're not quite cutting through the way they should. Would love to hear them sitting higher so the lyrics can really land. The beat construction is solid and that hi hat pattern is fire — just get those vocals up a bit and this goes to another level!",
      firstImpression: "STRONG_HOOK" as const,
      productionScore: 3,
      vocalScore: 2,
      originalityScore: 5,        // STRONG_HOOK = 5
      qualityLevel: "ALMOST_THERE" as const,
      wouldListenAgain: true,
      lowEndClarity: "PERFECT" as const,
      vocalClarity: "BURIED" as const,
      highEndQuality: "PERFECT" as const,
      stereoWidth: "GOOD_BALANCE" as const,
      dynamics: "GREAT_DYNAMICS" as const,
      tooRepetitive: false,
      trackLength: "PERFECT" as const,
    },
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "johnsguice92@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: true,
        },
      },
    },
  });

  // Title uses Unicode Fraktur chars — match by artist's single track
  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("No tracks found for johnsguice92@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  for (const { email, name, review } of REVIEWERS) {
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

    if (!user.ReviewerProfile) throw new Error(`No reviewer profile for ${name}`);

    await prisma.$transaction([
      prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: user.ReviewerProfile.id,
          status: "COMPLETED",
          listenDuration: 160 + Math.floor(Math.random() * 60),
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

    console.log(`  ✅ Injected review from ${name}`);
  }

  // Sync final count and set COMPLETED if done
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

  console.log(`\n✅ Injected 3 reviews for "${track.title}"`);
  console.log(`   Track is now: ${isComplete ? "COMPLETED" : "IN_PROGRESS"} (${completedCount}/${track.reviewsRequested})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
