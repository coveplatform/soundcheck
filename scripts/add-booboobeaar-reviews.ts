import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

import { prisma } from "../src/lib/prisma";
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = "demo123456";

const REVIEWERS = [
  { email: "marcus.chen.music@gmail.com", name: "Marcus Chen" },
  { email: "sarahbeatsldn@hotmail.com", name: "Sarah Thompson" },
  { email: "alexkimbeats@gmail.com", name: "Alex Kim" },
];

const REVIEWS = [
  {
    // Review 1 - Encouraging & Supportive
    firstImpression: "STRONG_HOOK" as const,
    firstImpressionScore: 4,
    wouldListenAgain: true,
    quickWin: "Widen the stereo field by panning your doubled vocals left and right instead of keeping everything centered. The atmosphere you've built deserves more space.",
    biggestWeaknessSpecific: "The low end gets a bit cluttered around 100-200Hz where the bass and acoustic guitar are sitting on top of each other. A gentle EQ cut on the guitar in that range would let the bass anchor the track better and clear up the mix.",
    bestPart: "The vocal delivery in the quieter sections has this haunting, almost whispered quality that totally nails the mood you're going for. It draws you in and creates real tension. That restraint is way more powerful than if you were belting—it fits the vibe perfectly.",
    qualityLevel: "RELEASE_READY" as const,
    nextFocus: "MIXING" as const,
    playlistAction: "LET_PLAY" as const,
    // Derived scores
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    // Technical issues
    lowEndClarity: "BOTH_MUDDY" as const,
    stereoWidth: "TOO_NARROW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
  },
  {
    // Review 2 - Technical & Constructive
    firstImpression: "STRONG_HOOK" as const,
    firstImpressionScore: 4,
    wouldListenAgain: true,
    quickWin: "Pan that gentle percussion slightly off-center to create more width in the stereo field. Even just 20-30% left or right would open things up nicely.",
    biggestWeaknessSpecific: "The track stays in one dynamic lane for too long. The atmosphere is great, but adding more contrast—maybe pulling back the instrumentation in a verse or letting the percussion drop out for 8 bars—would make the fuller sections hit harder emotionally. Right now it's all moody plateau when it could ebb and flow.",
    bestPart: "The way the percussion sits so far back in the mix, almost like a heartbeat you can barely hear—that's a really smart production choice. It adds movement without breaking the spell of the atmosphere. Shows you understand that less is more for this kind of vibe.",
    qualityLevel: "ALMOST_THERE" as const,
    nextFocus: "ARRANGEMENT" as const,
    playlistAction: "LET_PLAY" as const,
    // Derived scores
    productionScore: 3,
    vocalScore: 4,
    originalityScore: 4,
    // Technical issues
    stereoWidth: "TOO_NARROW" as const,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
  },
  {
    // Review 3 - Balanced & Specific
    firstImpression: "STRONG_HOOK" as const,
    firstImpressionScore: 5,
    wouldListenAgain: true,
    quickWin: "Add a subtle high-pass filter to the reverb return around 200Hz. It'll keep that lush atmosphere without letting the low-mid frequencies get cloudy and boomy.",
    biggestWeaknessSpecific: "The outro lingers a bit too long without enough development. Either bring in a new element in the last 15-20 seconds or fade it earlier—right now it loses some of the tension and mystery you built up. End while they still want more.",
    bestPart: "When the vocals come in over that sparse arrangement with just the fingerpicking and distant percussion, it's genuinely chilling. The space between the notes creates this foreboding atmosphere that feels intentional and mature. You're not overproducing it, and that's exactly right for what you're doing. This moment alone could make someone stop scrolling.",
    qualityLevel: "RELEASE_READY" as const,
    nextFocus: "ARRANGEMENT" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    // Derived scores
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    // Technical issues (none selected)
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    trackLength: "PERFECT" as const,
  },
];

async function main() {
  console.log('🎵 Adding reviews for BooBooBeaar track...\n');

  // Find the track
  const track = await prisma.track.findFirst({
    where: {
      title: {
        contains: "Think Of Me",
      },
    },
    include: {
      ArtistProfile: {
        include: {
          User: true,
        },
      },
    },
  });

  if (!track) {
    console.error('❌ Track not found');
    process.exit(1);
  }

  console.log(`✓ Found track: "${track.title}" by ${track.ArtistProfile?.User?.name || 'Unknown'}`);
  console.log(`  Track ID: ${track.id}\n`);

  // Hash password
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  // Create/get reviewers
  const reviewers = [];
  for (const { email, name } of REVIEWERS) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { ReviewerProfile: true },
    });

    if (!user) {
      console.log(`Creating demo reviewer: ${name} (${email})`);
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          emailVerified: new Date(),
          isReviewer: true,
          ReviewerProfile: {
            create: {
              tier: "NORMAL",
            },
          },
        },
        include: { ReviewerProfile: true },
      });
    } else {
      console.log(`✓ Found existing reviewer: ${name}`);
    }

    if (user.ReviewerProfile) {
      reviewers.push(user.ReviewerProfile);
    }
  }

  console.log(`\n📝 Creating ${REVIEWS.length} reviews...\n`);

  // Create reviews
  let count = 0;
  for (let i = 0; i < REVIEWS.length; i++) {
    const reviewer = reviewers[i];
    const reviewData = REVIEWS[i];

    if (!reviewer || !reviewData) continue;

    try {
      const review = await prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewer.id,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          listenDuration: 120, // 2 minutes
          weakestPart: reviewData.biggestWeaknessSpecific, // Map for backwards compatibility
          ...reviewData,
        },
      });

      count++;
      console.log(`✓ Review ${count} created by ${REVIEWERS[i]?.name}`);
      console.log(`  Quality: ${reviewData.qualityLevel}`);
      console.log(`  Next Focus: ${reviewData.nextFocus}`);
      console.log(`  Playlist Action: ${reviewData.playlistAction}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to create review ${i + 1}:`, error.message);
    }
  }

  // Update track stats
  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: {
        increment: count,
      },
      ...(track.reviewsCompleted + count >= track.reviewsRequested
        ? { status: "COMPLETED", completedAt: new Date() }
        : { status: "IN_PROGRESS" }),
    },
  });

  console.log(`\n✅ Successfully added ${count} reviews to "${track.title}"`);
  console.log(`   Track now has ${track.reviewsCompleted + count}/${track.reviewsRequested} reviews`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
