import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_REVIEWERS = [
  { email: "lisa.popwave@gmail.com", name: "Lisa Monroe" },
  { email: "dan.retropop@gmail.com", name: "Dan Kowalski" },
];

const reviews = [
  {
    // Lisa — enthusiastic pop rock fan, warm, Train reference, uses "!"
    // Angle: chorus is the hook, highs get a bit much in louder sections
    bestPart:
      "The chorus on this is genuinely addictive — it just lodges itself in your head immediately. The whole thing has this great late 90s pop rock energy that works really well. Reminds me of Train in all the right ways!",
    biggestWeaknessSpecific:
      "Some of the louder sections get a bit bright and tiring on the ears — like the top end pushes a little too hard in the busier parts and loses some warmth. Also the mid section dips in energy slightly before you get to that great ending. The ending really delivers though!",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,           // RELEASE_READY
    vocalScore: 4,                // catchy and clear
    originalityScore: 5,          // STRONG_HOOK = 5
    qualityLevel: "RELEASE_READY" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "TOO_HARSH" as const,   // highs too bright in louder sections
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Dan — brief, 90s music head, "For me..." style, more measured
    // Angle: ending is the strongest part, verse-to-chorus energy gap is the issue
    bestPart:
      "The ending is the strongest part of this track — it pays off in a way that feels genuinely earned. The nostalgic production is done well and the vocals have real character to them throughout.",
    biggestWeaknessSpecific:
      "For me the verses dont build quite enough momentum before each chorus hits. The track keeps kind of resetting and it makes the drive feel a bit inconsistant. I think closing the gap between verse energy and chorus energy would help it feel like one continuous thing rather than stopping and starting. The final section shows what the whole thing could be.",
    firstImpression: "DECENT" as const,
    productionScore: 3,           // ALMOST_THERE
    vocalScore: 4,
    originalityScore: 3,          // DECENT = 3
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,     // different technical profile from Review 1
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "tobedarid@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { sourceUrl: { contains: "if-this-is-it", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track not found for tobedarid@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
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
    throw new Error("Not enough reviewer profiles");
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
          listenDuration: 170 + Math.floor(Math.random() * 60),
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
