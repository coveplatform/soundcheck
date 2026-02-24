import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const SEED_REVIEWERS = [
  { email: "kevin.grooves@gmail.com", name: "Kevin Nguyen" },
  { email: "amanda.vibes@icloud.com", name: "Amanda Foster" },
];

const reviews = [
  {
    // Brief, warm personality — lower mids EQ angle
    bestPart:
      "The overall mood hits right away. There's something really atmospheric about how this sits — feels like it has its own world.",
    biggestWeaknessSpecific:
      "The mid section kind of loses its energy for me. The track almost builds to something and then it just kind of stays there. Also theres a slight build up in the lower mids that muddies the mix a little in busier moments — cleaning that up would help the clarity a lot.",
    firstImpression: "DECENT" as const,
    productionScore: 3,   // ALMOST_THERE
    vocalScore: 4,        // vocals present, clear
    originalityScore: 3,  // = firstImpressionScore for DECENT
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
    // Chatty personality — intro pacing + vocals buried
    bestPart:
      "Honestly really like the production on this. The textures are well put together and it has a strong sense of identity.",
    biggestWeaknessSpecific:
      "I think the intro takes a little too long to get going. By the time it opens up it's great but you lose a bit of attention before that happens. Also the vocals feel slightly burried under the instrumentation at times — turning them up just a notch would let them cut through better.",
    firstImpression: "DECENT" as const,
    productionScore: 3,   // ALMOST_THERE
    vocalScore: 2,        // vocals buried → score 2
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
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "ppepon788@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "Repressed", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'Repressed Reprise' not found for ppepon788@gmail.com");
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

  const newCompleted = (track.reviewsCompleted ?? 0) + reviews.length;
  const isComplete = newCompleted >= (track.reviewsRequested ?? 3);

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
