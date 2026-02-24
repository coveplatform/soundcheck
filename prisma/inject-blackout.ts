import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const REVIEWERS = [
  {
    email: "sarah.vibecheck@gmail.com",
    name: "wavvkira",
    review: {
      // Sarah: atmospheric listener, uses "...", appreciates mood, spelling mistakes
      bestPart:
        "Those chimes in this are something else honestly... they add this really haunting quality that pulls you straight in from the start.",
      biggestWeaknessSpecific:
        "I think the mid section kind of looses its momentum a little. Like after the initial build things drift a bit and you feel the energy dip somwhere in the middle. The track is at its best when everything is layered up and hitting together — some of the quieter transitional parts don't quite hold the tension the same way. Still a really atmospheric peice though, the gothic vibe is done really well.",
      firstImpression: "STRONG_HOOK" as const,
      productionScore: 3,         // ALMOST_THERE
      vocalScore: 4,              // vocals fine
      originalityScore: 5,        // STRONG_HOOK = 5
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
  },
  {
    email: "marcus.alt.ears@hotmail.com",
    name: "rickbeatz",
    review: {
      // Marcus: brief, analytical, experimental music listener, direct
      bestPart:
        "The gothic orchestral vibe is well executed. Synth pads and guitar sit together really nicely and give it a genuinely cinematic feel.",
      biggestWeaknessSpecific:
        "A couple of the transitions feel a bit abrupt to me. The track moves through different moods and sections which is cool, but some of the shifts come out of nowhere and knock you out of the zone a little. Smoother movement between those sections would make the whole thing feel more intentional and let the emotions land harder. The chimes are a great touch though — very orignal choice.",
      firstImpression: "DECENT" as const,
      productionScore: 3,
      vocalScore: 4,
      originalityScore: 3,        // DECENT = 3
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
  },
  {
    email: "donna.listens22@gmail.com",
    name: "jleo2x",
    review: {
      // Donna: chatty, emotive, uses "!" and "Ah", loves orchestral/emotional music
      bestPart:
        "Oh wow the emotions in this are on another level! That orchestral gothic feel with the chimes and synth pads layered together is genuinely beautiful stuff.",
      biggestWeaknessSpecific:
        "Ah the main thing for me is the ending feels like it resolves a little too quickly. You build up so much atmosphere and emotion throughout and then it kind of wraps up before I felt fully satisfied with it. Would love a bit more time to just let it breathe and settle at the end — give the listener a moment to sit with everything. The different textures and layers in this are stunning though, it's a really orginal sounding track!",
      firstImpression: "STRONG_HOOK" as const,
      productionScore: 3,
      vocalScore: 4,
      originalityScore: 5,        // STRONG_HOOK = 5
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
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "ppepon788@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "Blackout", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'Blackout' not found for ppepon788@gmail.com");
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
          listenDuration: 170 + Math.floor(Math.random() * 60),
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
