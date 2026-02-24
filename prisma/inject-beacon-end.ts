import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const SEED_REVIEWERS = [
  { email: "tyler.mixmaster@gmail.com", name: "Tyler Jackson" },
  { email: "rachel.audiophile@hotmail.com", name: "Rachel Green" },
  { email: "brandon.lowend@gmail.com", name: "Brandon Scott" },
];

const reviews = [
  {
    // Direct "For me..." style — 3:30 drag + low end washy
    bestPart:
      "The percussion is the highlight for sure. Those tom and kick fills are really well placed and give the track proper momentum. The sidechain on the vocal effect is a cool creative touch.",
    biggestWeaknessSpecific:
      "For me the section around 3:30 drags on a bit too long and loses the momentum the track had going. Also I noticed the low end gets a bit heavy and washy through that section — like the bass and kick start fighting each other a bit. Worth tightening that up.",
    firstImpression: "DECENT" as const,
    productionScore: 4,   // RELEASE_READY
    vocalScore: 4,        // vocals present, clear
    originalityScore: 3,  // DECENT = 3
    qualityLevel: "RELEASE_READY" as const,
    wouldListenAgain: true,
    lowEndClarity: "BOTH_MUDDY" as const,  // low end issue flagged
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Chatty "Also" style — 3:55 synth too loud + high synths harsh
    bestPart:
      "Solid Nitzer Ebb energy on this. The synth work is tough and the basslines hit right. I really like the vocal processing too, that sidechain effect gives it a proper retro industrial feel.",
    biggestWeaknessSpecific:
      "The synth that comes in around 3:55 is quite a bit louder than everthing else and kind of jolts you out of the track. Also some of the higher synth layers get a little harsh and fatiguing in the louder sections — a bit of taming in the top end would smooth that out.",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,   // RELEASE_READY
    vocalScore: 4,
    originalityScore: 5,  // STRONG_HOOK = 5
    qualityLevel: "RELEASE_READY" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "TOO_HARSH" as const,  // high end issue flagged
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Brief, honest — arrangement/resolution angle, different from the others
    bestPart:
      "The groove and rawness of this are the highlights for me. Reminds me of classic EBM in the best way. Those drum fills are well placed and give the track real momentum.",
    biggestWeaknessSpecific:
      "Somthing I noticed is that the section starting around 3:30 goes on a little too long. The track was really cooking before that and then it kind of plateaus there. Also one of the synth layers at around 3:55 is a little hot in the mix and pulls your attention in a distracting way.",
    firstImpression: "DECENT" as const,
    productionScore: 3,   // ALMOST_THERE
    vocalScore: 4,
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
    where: { email: "a.heber@gmx.de" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { title: { contains: "Beacon", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track 'Beacon of the end' not found for a.heber@gmx.de");
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
  const isComplete = newCompleted >= (track.reviewsRequested ?? 5);

  await prisma.$transaction([
    ...reviews.map((r, i) =>
      prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewerProfiles[i]!.id,
          status: "COMPLETED",
          listenDuration: 210 + Math.floor(Math.random() * 50),
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
