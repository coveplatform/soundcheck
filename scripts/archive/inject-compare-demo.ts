import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const ARTIST_EMAIL = "kris.engelhardt4@gmail.com";

// Five seeds with distinct personalities
const SEEDS = [
  { name: "Jordan Wells",  email: "jordanwells@seed.mixreflect.com"  },
  { name: "Emery Cole",    email: "emerycole@seed.mixreflect.com"    },
  { name: "Casey Morgan",  email: "caseymorgan@seed.mixreflect.com"  },
  { name: "Peyton Flores", email: "peytonflores@seed.mixreflect.com" },
  { name: "Quinn Adams",   email: "quinnadams@seed.mixreflect.com"   },
];

// 3 prefer Version B, 2 prefer Version A — clear but not unanimous
const REVIEWS: Array<{
  preference: "VERSION_A" | "VERSION_B";
  comment: string;
  // Full form data for Track A review
  bestPart: string;
  biggestWeaknessSpecific: string;
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  firstImpressionScore: number;
  qualityLevel: "PROFESSIONAL" | "RELEASE_READY" | "ALMOST_THERE" | "DEMO_STAGE";
  technicalIssues: string[];
}> = [
  {
    preference: "VERSION_B",
    comment: "Version B just has more room to breathe. The dynamics hit harder and the mix feels more polished overall.",
    bestPart: "The hook is genuinely strong and the vocal delivery throughout is confident. You can feel the intention behind every line.",
    biggestWeaknessSpecific: "Version A feels a little squashed to me. Like the compression is working against the track rather than with it. There are moments where I want the mix to open up and it doesnt quite do that. Version B handles this much better — you get the same energy but with more punch.",
    firstImpression: "STRONG_HOOK",
    firstImpressionScore: 4,
    qualityLevel: "RELEASE_READY",
    technicalIssues: ["compressed"],
  },
  {
    preference: "VERSION_B",
    comment: "The low end clarity in Version B is noticeably better. Version A felt muddy in certain sections.",
    bestPart: "The arrangement is well thought out and the track builds in a satisfying way. The instrumental sections dont overstay their welcome.",
    biggestWeaknessSpecific: "The low end in this version is a bit muddy for me. The kick and bass are competing for space and it takes away from the overall punch. I had to really listen to pick it apart from the mix. Version B solves this cleanly.",
    firstImpression: "DECENT",
    firstImpressionScore: 3,
    qualityLevel: "ALMOST_THERE",
    technicalIssues: ["muddy-low"],
  },
  {
    preference: "VERSION_A",
    comment: "Personally I liked the rawer feel of Version A — Version B sounded a little too polished and lost some character.",
    bestPart: "There's something about the energy in this version that just feels right. Its got a rawness to it that I think connects more emotionally than the cleaner mix.",
    biggestWeaknessSpecific: "The mix could use some work in the low mids but honestly I think thats part of its charm. The biggest thing Id flag is the transition around the 2 minute mark feels a bit abrupt. Could use a small fill or build to smooth it out.",
    firstImpression: "STRONG_HOOK",
    firstImpressionScore: 5,
    qualityLevel: "RELEASE_READY",
    technicalIssues: [],
  },
  {
    preference: "VERSION_B",
    comment: "Version B is the one. Sounds more professional and the low end is properly sorted.",
    bestPart: "The vocal hooks are the standout here. They stick with you after the track ends. Also the production has a clarity to it that makes everything feel intentional.",
    biggestWeaknessSpecific: "My main note is the structure in the second half feels a bit samey. It maintains the same energy from the main chorus all the way through to the outro without much variation. Even a small breakdown or dynamic shift would give the final section a lot more impact. Somthing to consider for either version.",
    firstImpression: "DECENT",
    firstImpressionScore: 3,
    qualityLevel: "ALMOST_THERE",
    technicalIssues: [],
  },
  {
    preference: "VERSION_A",
    comment: "Hard to pick but Version A felt more natural to me. The added polish in B made it sound a bit generic.",
    bestPart: "The production style is genuinely distinctive and the track has a clear identity from the first few seconds. Thats actually harder to achieve than most people think.",
    biggestWeaknessSpecific: "For me the track could resolve more decisively at the end. It kind of fades out when I feel like it wants to make a bigger statement. The outro in particular feels like it gives up a bit early. Not a huge thing but it would make the overall arc feel more complete.",
    firstImpression: "DECENT",
    firstImpressionScore: 3,
    qualityLevel: "ALMOST_THERE",
    technicalIssues: [],
  },
];

function generateShareId() {
  return `cmp${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
}

function qualityToScore(q: string) {
  return ({ PROFESSIONAL: 5, RELEASE_READY: 4, ALMOST_THERE: 3, DEMO_STAGE: 2, NOT_READY: 1 } as any)[q] ?? 3;
}

async function ensureSeed(s: { name: string; email: string }) {
  const user = await prisma.user.upsert({
    where: { email: s.email },
    update: {},
    create: { email: s.email, name: s.name, isArtist: true, isReviewer: false, emailVerified: new Date() },
  });
  const profile = await prisma.artistProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id, artistName: s.name, completedOnboarding: true,
      reviewCredits: 0, reviewerExpertise: "INTERMEDIATE", experienceLevel: "INTERMEDIATE",
    },
  });
  return profile.id;
}

async function main() {
  // Get artist
  const user = await prisma.user.findUnique({ where: { email: ARTIST_EMAIL }, select: { id: true } });
  if (!user) throw new Error(`User ${ARTIST_EMAIL} not found`);
  const ap = await prisma.artistProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!ap) throw new Error("Artist profile not found");

  // Create Track A (primary)
  const trackA = await prisma.track.create({
    data: {
      artistId: ap.id,
      title: "Fade Into You — Version A (Original Mix)",
      sourceUrl: "https://soundcloud.com/krisengel/fade-into-you-v1",
      sourceType: "SOUNDCLOUD",
      artworkUrl: "https://i1.sndcdn.com/artworks-000000000001-000000-t500x500.jpg",
      packageType: "PEER",
      isAbTest: true,
      reviewsRequested: 5,
      reviewsCompleted: 0,
      creditsSpent: 10,
      status: "COMPLETED",
      isPublic: false,
      feedbackAreas: ["MIXING", "ARRANGEMENT"],
      paidAt: new Date(),
    },
  });

  // Create Track B (secondary)
  const trackB = await prisma.track.create({
    data: {
      artistId: ap.id,
      title: "Fade Into You — Version B (Radio Edit)",
      sourceUrl: "https://soundcloud.com/krisengel/fade-into-you-v2",
      sourceType: "SOUNDCLOUD",
      artworkUrl: "https://i1.sndcdn.com/artworks-000000000002-000000-t500x500.jpg",
      packageType: "PEER",
      isAbTest: true,
      abTestPrimaryTrackId: trackA.id,
      reviewsRequested: 5,
      reviewsCompleted: 0,
      creditsSpent: 0,
      status: "COMPLETED",
      isPublic: false,
      feedbackAreas: ["MIXING", "ARRANGEMENT"],
      paidAt: new Date(),
    },
  });

  console.log(`Track A: ${trackA.id} — ${trackA.title}`);
  console.log(`Track B: ${trackB.id} — ${trackB.title}`);

  // Create seed profiles
  const seedIds = await Promise.all(SEEDS.map(ensureSeed));

  // Create reviews
  for (let i = 0; i < REVIEWS.length; i++) {
    const r = REVIEWS[i];
    const seedId = seedIds[i];
    const hasVocalIssue = r.technicalIssues.includes("buried-vocals");
    const isCompressed = r.technicalIssues.includes("compressed");
    const isMuddyLow = r.technicalIssues.includes("muddy-low");

    // Track A — full review
    await prisma.review.create({
      data: {
        trackId: trackA.id,
        peerReviewerArtistId: seedId,
        isPeerReview: true,
        status: "COMPLETED",
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId: generateShareId(),
        listenDuration: 180 + Math.floor(Math.random() * 240),
        firstImpression: r.firstImpression,
        productionScore: qualityToScore(r.qualityLevel),
        vocalScore: hasVocalIssue ? 2 : 4,
        originalityScore: r.firstImpressionScore,
        wouldListenAgain: r.preference === "VERSION_B" ? true : true,
        qualityLevel: r.qualityLevel,
        vocalClarity: hasVocalIssue ? "BURIED" : "CRYSTAL_CLEAR",
        lowEndClarity: isMuddyLow ? "BOTH_MUDDY" : "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: isCompressed ? "TOO_COMPRESSED" : "GREAT_DYNAMICS",
        tooRepetitive: false,
        trackLength: "PERFECT",
        playlistAction: "LET_PLAY",
        nextFocus: "MIXING",
        bestPart: r.bestPart,
        biggestWeaknessSpecific: r.biggestWeaknessSpecific,
        weakestPart: r.biggestWeaknessSpecific,
        abTestPreference: r.preference,
        abTestComment: r.comment,
      },
    });

    // Track B — preference only
    await prisma.review.create({
      data: {
        trackId: trackB.id,
        peerReviewerArtistId: seedId,
        isPeerReview: true,
        status: "COMPLETED",
        countsTowardCompletion: true,
        countsTowardAnalytics: true,
        reviewSchemaVersion: 3,
        shareId: generateShareId(),
        listenDuration: 180 + Math.floor(Math.random() * 240),
        abTestPreference: r.preference,
        abTestComment: r.comment,
        firstImpression: r.firstImpression,
        productionScore: qualityToScore(r.qualityLevel),
        originalityScore: r.firstImpressionScore,
        vocalScore: 4,
        wouldListenAgain: true,
        qualityLevel: r.qualityLevel,
        vocalClarity: "CRYSTAL_CLEAR",
        lowEndClarity: "PERFECT",
        highEndQuality: "PERFECT",
        stereoWidth: "GOOD_BALANCE",
        dynamics: "GREAT_DYNAMICS",
        tooRepetitive: false,
        trackLength: "PERFECT",
        playlistAction: "LET_PLAY",
        nextFocus: "MIXING",
        bestPart: r.bestPart,
        biggestWeaknessSpecific: r.comment,
        weakestPart: r.comment,
      },
    });

    console.log(`  [${i + 1}/5] ${SEEDS[i].name} — preferred ${r.preference}`);
  }

  // Update review counts
  await Promise.all([
    prisma.track.update({ where: { id: trackA.id }, data: { reviewsCompleted: 5, completedAt: new Date() } }),
    prisma.track.update({ where: { id: trackB.id }, data: { reviewsCompleted: 5, completedAt: new Date() } }),
  ]);

  console.log(`\nDone! Go to /tracks/${trackA.id} to see the Compare results.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
