import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_REVIEWERS = [
  { email: "tyler.heavyriff@gmail.com", name: "Tyler Brooks" },
  { email: "ash.metalcraft@gmail.com", name: "Ash Reid" },
];

const reviews = [
  {
    // Tyler — metal head, direct, "For me..." — drums too quiet killing the punch
    // Angle: vocals + 2:41 as positives, drums not matching the energy
    bestPart:
      "The screaming vocals are genuinely impressive — great tone and real conviction in the delivery. The guitar work is tight and the moment at 2:41 is absolutely sick.",
    biggestWeaknessSpecific:
      "For me the drums are the one thing holding this back. They're way too quiet in the mix and completely let down all the energy the guitars and vocals are creating. Metal needs those drums to hit hard and feel menacing — right now they're sitting so far back that the track loses the punch it should have. Getting those drums to hit the way the instrumentation deserves would take this to another level.",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 3,
    vocalScore: 4,
    originalityScore: 5,
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "TOO_COMPRESSED" as const,    // drums squashed, lacking punch
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Ash — screamo/metal fan, more descriptive and passionate, "Also"
    // Angle: the lost potential — guitars/vocals going off but drums being polite
    // Clean technical profile — different from Tyler
    bestPart:
      "The guitar tone is really well done and the screaming vocals suit the track perfectly. Also that section at 2:41 is genuinely sick — real standout moment that shows what this can do.",
    biggestWeaknessSpecific:
      "The thing that keeps pulling me out of it is how soft the percussion is. Like the guitars and vocals are going absolutely off and then the drums just arent matching that aggression at all. It makes the whole thing feel almost polite when it should be absolutely battering you. The menace of the genre is kind of sitting on the table — getting those drums to hit harder would unlock all of that.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 4,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,    // different profile — describes it in text instead
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "voxmusic170@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "Misery", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'Misery' not found for voxmusic170@gmail.com");
  }

  const track = artistUser.ArtistProfile.Track[0];
  console.log(`Found track: "${track.title}" (${track.id})`);
  console.log(`Status: ${track.status}, Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

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
          listenDuration: 165 + Math.floor(Math.random() * 60),
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
