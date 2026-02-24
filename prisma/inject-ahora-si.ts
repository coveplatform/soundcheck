import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_REVIEWERS = [
  { email: "felix.techsound@gmail.com", name: "Felix Bauer" },
  { email: "nina.rave3am@gmail.com", name: "Nina Petrova" },
];

const reviews = [
  {
    // Felix — precise, techno listener, direct
    // Angle: percussion lacking groove/swing + sitting too far back in mix
    bestPart:
      "The synth work at 1:41 is the standout moment — it has a really cool South American character that gives the track genuine personality. The sound design is good throughout.",
    biggestWeaknessSpecific:
      "The percussion is the main thing that needs work. It sits too far back in the mix and feels quite static — there's no real swing or groove to it which is a big deal in techno. Adding some rhythmic variation and bringing the percussion more forward would change the feel of this completely. Right now it kind of plods along rather than driving the track the way it should.",
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
    dynamics: "TOO_COMPRESSED" as const,    // static percussion, no groove
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Nina — chatty, "Also" connector, club music fan
    // Angle: disjointed opening + lack of overall cohesion (structural, not mix)
    // Clean technical profile — different from Felix
    bestPart:
      "The sound design at 2:08 right at the end is really cool — that moment has a lot of character. Also the South American vibe running through the synths gives it a nice distinct identity that you dont hear every day.",
    biggestWeaknessSpecific:
      "The first 30 seconds or so feel a bit disjointed and its hard to know where the track is going at first. Also the different elements feel a bit disconnected from each other — like there are some cool individual sounds but they dont fully come together into one cohesive thing. I think working on how the sections transition into each other would help the track feel much more unified and intentional.",
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: null,
    originalityScore: 4,                    // finds the idea more original
    qualityLevel: "ALMOST_THERE" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "NOT_APPLICABLE" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,    // different technical profile
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  const artistUser = await prisma.user.findUnique({
    where: { email: "carlos.castelbsan@gmail.com" },
    include: {
      ArtistProfile: {
        include: {
          Track: {
            where: { sourceUrl: { contains: "ahora-si", mode: "insensitive" } },
          },
        },
      },
    },
  });

  if (!artistUser?.ArtistProfile?.Track?.[0]) {
    throw new Error("Track not found for carlos.castelbsan@gmail.com");
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
          listenDuration: 185 + Math.floor(Math.random() * 70),
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
