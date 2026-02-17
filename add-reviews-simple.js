// Load environment BEFORE anything else
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Now we can load Prisma
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🎵 Adding reviews for BooBooBeaar...\n');

  // Find track
  const track = await prisma.track.findFirst({
    where: { title: { contains: 'Think Of Me' } }
  });

  if (!track) {
    throw new Error('Track not found');
  }

  console.log(`✓ Found track: "${track.title}" (${track.id})\n`);

  // Create/find reviewers
  const reviewers = [
    { email: 'marcus.chen.music@gmail.com', name: 'Marcus Chen' },
    { email: 'sarahbeatsldn@hotmail.com', name: 'Sarah Thompson' },
    { email: 'alexkimbeats@gmail.com', name: 'Alex Kim' }
  ];

  const passwordHash = bcrypt.hashSync('demo123456', 10);
  const reviewerProfiles = [];

  for (const { email, name } of reviewers) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { ReviewerProfile: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          emailVerified: new Date(),
          isReviewer: true,
          ReviewerProfile: { create: { tier: 'NORMAL' } }
        },
        include: { ReviewerProfile: true }
      });
      console.log(`✓ Created reviewer: ${name}`);
    } else {
      console.log(`✓ Found reviewer: ${name}`);
    }

    reviewerProfiles.push(user.ReviewerProfile);
  }

  console.log('\n📝 Creating reviews...\n');

  // Review 1
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: reviewerProfiles[0].id,
      status: 'COMPLETED',
      firstImpression: 'STRONG_HOOK',
      wouldListenAgain: true,
      productionScore: 4,
      vocalScore: 4,
      originalityScore: 4,
      qualityLevel: 'RELEASE_READY',
      nextFocus: 'MIXING',
      playlistAction: 'LET_PLAY',
      lowEndClarity: 'BOTH_MUDDY',
      stereoWidth: 'TOO_NARROW',
      vocalClarity: 'CRYSTAL_CLEAR',
      highEndQuality: 'PERFECT',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Widen the stereo field by panning your doubled vocals left and right instead of keeping everything centered. The atmosphere you\'ve built deserves more space.',
      biggestWeaknessSpecific: 'The low end gets a bit cluttered around 100-200Hz where the bass and acoustic guitar are sitting on top of each other. A gentle EQ cut on the guitar in that range would let the bass anchor the track better and clear up the mix.',
      bestPart: 'The vocal delivery in the quieter sections has this haunting, almost whispered quality that totally nails the mood you\'re going for. It draws you in and creates real tension. That restraint is way more powerful than if you were belting—it fits the vibe perfectly.',
      weakestPart: 'The low end gets a bit cluttered around 100-200Hz where the bass and acoustic guitar are sitting on top of each other. A gentle EQ cut on the guitar in that range would let the bass anchor the track better and clear up the mix.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review 1 created (Marcus - RELEASE_READY)');

  // Review 2
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: reviewerProfiles[1].id,
      status: 'COMPLETED',
      firstImpression: 'STRONG_HOOK',
      wouldListenAgain: true,
      productionScore: 3,
      vocalScore: 4,
      originalityScore: 4,
      qualityLevel: 'ALMOST_THERE',
      nextFocus: 'ARRANGEMENT',
      playlistAction: 'LET_PLAY',
      lowEndClarity: 'PERFECT',
      stereoWidth: 'TOO_NARROW',
      vocalClarity: 'CRYSTAL_CLEAR',
      highEndQuality: 'PERFECT',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Pan that gentle percussion slightly off-center to create more width in the stereo field. Even just 20-30% left or right would open things up nicely.',
      biggestWeaknessSpecific: 'The track stays in one dynamic lane for too long. The atmosphere is great, but adding more contrast—maybe pulling back the instrumentation in a verse or letting the percussion drop out for 8 bars—would make the fuller sections hit harder emotionally. Right now it\'s all moody plateau when it could ebb and flow.',
      bestPart: 'The way the percussion sits so far back in the mix, almost like a heartbeat you can barely hear—that\'s a really smart production choice. It adds movement without breaking the spell of the atmosphere. Shows you understand that less is more for this kind of vibe.',
      weakestPart: 'The track stays in one dynamic lane for too long. The atmosphere is great, but adding more contrast—maybe pulling back the instrumentation in a verse or letting the percussion drop out for 8 bars—would make the fuller sections hit harder emotionally. Right now it\'s all moody plateau when it could ebb and flow.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review 2 created (Sarah - ALMOST_THERE)');

  // Review 3
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: reviewerProfiles[2].id,
      status: 'COMPLETED',
      firstImpression: 'STRONG_HOOK',
      wouldListenAgain: true,
      productionScore: 4,
      vocalScore: 4,
      originalityScore: 5,
      qualityLevel: 'RELEASE_READY',
      nextFocus: 'ARRANGEMENT',
      playlistAction: 'ADD_TO_LIBRARY',
      lowEndClarity: 'PERFECT',
      stereoWidth: 'GOOD_BALANCE',
      vocalClarity: 'CRYSTAL_CLEAR',
      highEndQuality: 'PERFECT',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Add a subtle high-pass filter to the reverb return around 200Hz. It\'ll keep that lush atmosphere without letting the low-mid frequencies get cloudy and boomy.',
      biggestWeaknessSpecific: 'The outro lingers a bit too long without enough development. Either bring in a new element in the last 15-20 seconds or fade it earlier—right now it loses some of the tension and mystery you built up. End while they still want more.',
      bestPart: 'When the vocals come in over that sparse arrangement with just the fingerpicking and distant percussion, it\'s genuinely chilling. The space between the notes creates this foreboding atmosphere that feels intentional and mature. You\'re not overproducing it, and that\'s exactly right for what you\'re doing. This moment alone could make someone stop scrolling.',
      weakestPart: 'The outro lingers a bit too long without enough development. Either bring in a new element in the last 15-20 seconds or fade it earlier—right now it loses some of the tension and mystery you built up. End while they still want more.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review 3 created (Alex - RELEASE_READY)');

  // Update track stats
  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: { increment: 3 },
      status: track.reviewsCompleted + 3 >= track.reviewsRequested ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: track.reviewsCompleted + 3 >= track.reviewsRequested ? new Date() : null
    }
  });

  console.log('\n✅ Successfully added 3 reviews!');
  console.log(`   Track: ${track.reviewsCompleted + 3}/${track.reviewsRequested} reviews complete`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
