import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_REVIEWERS = [
  { email: "omar.wavehead@gmail.com", name: "Omar Hassan" },
  { email: "sophie.digitalmix@gmail.com", name: "Sophie Clarke" },
  { email: "jamal.beatcrave@gmail.com", name: "Jamal Williams" },
];

const reviews = [
  {
    // Omar — concise, electronic head, "For me..." — covers both the 2:50 spike AND low end
    bestPart:
      "The sound design in this is genuinely creative — lots of interesting textures and the drum breaks around 3:48 hit exactly right. Real attention to detail throughout.",
    biggestWeaknessSpecific:
      "For me the section around 2:50 is too aggressive — it spikes really hard and kind of blows everything out. Pulling that back a fair bit would keep the intensity without crossing into uncomfortable. Also the low end needs more presence throughout, it gets a bit lost behind all the other elements and could punch through more.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: null,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "BOTH_MUDDY" as const,
    vocalClarity: "NOT_APPLICABLE" as const,
    highEndQuality: "TOO_HARSH" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Sophie — experimental fan, uses "...", different angle: hectic opening / pacing issue
    // Clean technical profile — she doesn't flag the highs or low end, her issue is structural
    bestPart:
      "The experimental approach here is what makes it interesting... lots of creative sound design choices and real personality in how it all fits together. The second half especially has some great moments.",
    biggestWeaknessSpecific:
      "The opening throws a lot at you at once and it takes a while to find your footing... like there's a whole arp wall hitting you before you've had a chance to settle into the vibe. I think easing the listener in a bit more at the start would help. The track has a great feel once it opens up but that first stretch is a lot to take in all at once.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: null,
    originalityScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "NOT_APPLICABLE" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Jamal — enthusiastic, beats-focused, "Basically..." opener — only flags the low end
    // Higher scores, positive impression — gives the track more credit overall
    bestPart:
      "Those drum breaks at 3:48 are the highlight for me — they hit really well and give the track this great moment of release. The overall sound design is super cool and theres a lot going on that rewards repeat listens.",
    biggestWeaknessSpecific:
      "Basically the one thing I'd fix is the low end. It doesnt quite push through the way it should and with all the interesting stuff happening on top it kind of needs that foundation to lock everything in. The mix sounds a bit thin without it. Getting that sub and kick presence sorted would take this to another level for real.",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: null,
    originalityScore: 5,
    qualityLevel: "RELEASE_READY" as const,
    wouldListenAgain: true,
    lowEndClarity: "BOTH_MUDDY" as const,
    vocalClarity: "NOT_APPLICABLE" as const,
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
    where: { email: "rellval06@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "3 by darnell", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track '<3 by darnellsimon' not found for rellval06@gmail.com");
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
          listenDuration: 200 + Math.floor(Math.random() * 80),
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
