import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_REVIEWERS = [
  { email: "kezia.vibes@gmail.com", name: "Kezia Thomas" },
  { email: "ray.trackhead@gmail.com", name: "Ray Malone" },
  { email: "leon.freshear@gmail.com", name: "Leon Garcia" },
];

const reviews = [
  {
    // Kezia — warm hip-hop listener, personal "For me..." — vocal clarity is the main issue
    // Angle: vocal feels muted/swallowed, doesn't cut through, praises piano + bass
    bestPart:
      "The piano melody in the background is a really nice touch — it gives the track a mellow but purposeful feel. The bass sounds good too and sits well underneath everything.",
    biggestWeaknessSpecific:
      "For me the main thing is the vocals — they sit in the mix in a way that feels a bit muted and lack the sharpness to really cut through. You can hear the performance but it doesnt hit with the clarity it could. Some work on the vocal presence and definition would make a big difference — right now it kind of gets swallowed rather than sitting on top where it belongs.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 2,                        // vocal issue
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "BURIED" as const,      // muted, lacks definition
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Ray — brief, beat-focused, "Basically..." — missing kick is the whole issue
    // Angle: beat feels lightweight without kick punch, different technical profile (no vocal flag)
    bestPart:
      "The vibe is solid and the bass has a nice warmth to it that suits the hip hop feel. The piano melody works well in the background — subtle but it adds a lot.",
    biggestWeaknessSpecific:
      "Basically what this track is missing is a kick to give it that drive. The beat feels a bit lightweight without somthing to anchor the rhythm — doesnt need to be a massive 808 or anything, just enough kick presence to push the track forward and give it some punch. Without it the low end kind of floats without really locking in the groove.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 4,                        // vocals fine for this reviewer
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "BOTH_MUDDY" as const, // kick missing = low end incomplete
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Leon — chatty, "Also" connector, structural energy angle — all clean technically
    // Angle: track doesn't build or shift enough throughout, mentions vocal flatness in passing
    bestPart:
      "The overall concept works and I like the laid back hip hop energy. Also the background piano is a nice subtle detail that adds a lot without being in your face. Cool vibe overall.",
    biggestWeaknessSpecific:
      "The track maintains pretty much the same energy level from start to finish and I kept waiting for a moment where it really lifts or shifts. Also I think the vocal sits in a bit of a flat space in the mix which makes it hard to hear all the detail in the performance. Giving the track more of a dynamic curve and sorting the vocal presence would help it feel more alive and give it that extra dimension.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 2,
    originalityScore: 4,                  // finds it more original than the other two
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
    where: { email: "bujubeats85@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "Lead Me", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'Lead Me' not found for bujubeats85@gmail.com");
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
          listenDuration: 175 + Math.floor(Math.random() * 70),
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
