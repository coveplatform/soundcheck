import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const SEED_REVIEWERS = [
  { email: "natasha.beats@hotmail.com", name: "Natasha Patel" },
  { email: "chris.soundwave@gmail.com", name: "Chris Anderson" },
];

const reviews = [
  {
    // Direct "For me..." — reverb causing mid muddiness
    bestPart:
      "The vocal sample in the background at the start sets the mood really nicely. It gives the track a real RnB feel from the jump.",
    biggestWeaknessSpecific:
      "For me there's a bit too much reverb on the lead vocals. It's creating a kind of muddiness in the mids that makes them feel like they're sitting back in the mix rather than cutting through. Pulling the reverb back and tightening the tail would let the actual vocal performance breathe a lot more and sit up front where it belongs.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 3,
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
  {
    // Chatty — vocals washed/distant, details swallowed
    bestPart:
      "The overall vibe of this is really cool. It's got that laid back hip hop RnB feel that sounds natural, not forced. The groove sits well.",
    biggestWeaknessSpecific:
      "The main thing I noticed is the vocals feel a bit washed out and distant throughout. Somthing is pushing them back in the mix. I think its the reverb — it's a bit long and heavy and kind of swallows up the details of the performance. Shortening the reverb decay would help a lot and make the track feel more intimate and upfront.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 3,
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

  const artistUser = await prisma.user.findUnique({
    where: { email: "pappysheed@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "Doe", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'Get The Doe' not found for pappysheed@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

  const reviewerProfiles = [];
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
      data: { reviewsCompleted: { increment: reviews.length }, status: "IN_PROGRESS" },
    }),
  ]);

  // Sync to actual completed count and mark done if threshold met
  const completedCount = await prisma.review.count({
    where: { trackId: track.id, status: "COMPLETED" },
  });
  const isComplete = completedCount >= (track.reviewsRequested ?? 3);

  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: completedCount,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      ...(isComplete ? { completedAt: new Date() } : {}),
    },
  });

  console.log(`\n✅ Injected ${reviews.length} reviews for "${track.title}"`);
  console.log(`   Track is now: ${isComplete ? "COMPLETED" : "IN_PROGRESS"} (${completedCount}/${track.reviewsRequested})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
