// Load environment BEFORE anything else
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Now we can load Prisma with the pg adapter
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const databaseUrl = process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('No database URL found in environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});

async function main() {
  console.log('🎵 Adding reviews for Hello! (Pete Seeger)...\n');

  // Find track
  const track = await prisma.track.findFirst({
    where: { title: { contains: 'Hello!' } }
  });

  if (!track) {
    throw new Error('Track not found');
  }

  console.log(`✓ Found track: "${track.title}" (${track.id})\n`);

  // Create/find reviewers
  const reviewers = [
    { email: 'marcus.chen.music@gmail.com', name: 'Marcus Chen' },
    { email: 'sarahbeatsldn@hotmail.com', name: 'Sarah Thompson' }
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

  // Review 1 - Marcus Chen
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: reviewerProfiles[0].id,
      status: 'COMPLETED',
      firstImpression: 'STRONG_HOOK',
      wouldListenAgain: true,
      productionScore: 2,
      vocalScore: 2,
      originalityScore: 4,
      qualityLevel: 'DEMO_STAGE',
      nextFocus: 'MIXING',
      playlistAction: 'LET_PLAY',
      lowEndClarity: 'BOTH_MUDDY',
      stereoWidth: 'GOOD_BALANCE',
      vocalClarity: 'CRYSTAL_CLEAR',
      highEndQuality: 'TOO_HARSH',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Turn down the vocal by like 2-3dB. It\'s way louder than everything else and kind of drowning out the music. Easy fix that\'ll make a huge difference.',
      biggestWeaknessSpecific: 'The vocal is just too loud and sitting in this muddy range that makes it sound boxy. Plus there\'s way too much reverb on it which is making everything sound far away and echoey. I\'d bring the level down first, then cut some of that muddiness around 200-300Hz, and definitely dial back that reverb. There\'s also a bit of background noise I can hear that the reverb is making worse.',
      bestPart: 'I really like the song choice and how you\'re singing it. There\'s this genuine warmth in your voice that works perfectly for this kind of folk vibe. The Pete Seeger influence is clear and you\'re doing it justice. Once you clean up the mix this is gonna sound so much better because the performance itself is already there.',
      weakestPart: 'The vocal is just too loud and sitting in this muddy range that makes it sound boxy. Plus there\'s way too much reverb on it which is making everything sound far away and echoey. I\'d bring the level down first, then cut some of that muddiness around 200-300Hz, and definitely dial back that reverb. There\'s also a bit of background noise I can hear that the reverb is making worse.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review 1 created (Marcus - DEMO_STAGE)');

  // Review 2 - Sarah Thompson
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: reviewerProfiles[1].id,
      status: 'COMPLETED',
      firstImpression: 'DECENT',
      wouldListenAgain: true,
      productionScore: 2,
      vocalScore: 2,
      originalityScore: 3,
      qualityLevel: 'DEMO_STAGE',
      nextFocus: 'MIXING',
      playlistAction: 'LET_PLAY',
      lowEndClarity: 'BOTH_MUDDY',
      stereoWidth: 'GOOD_BALANCE',
      vocalClarity: 'CRYSTAL_CLEAR',
      highEndQuality: 'PERFECT',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Just pull that vocal down a few dB and high-pass it around 100Hz. Those two things alone will clean up so much of what\'s making it sound muddy.',
      biggestWeaknessSpecific: 'Vocal is mixed way too loud compared to everything else. It\'s also super reverb-heavy which is making it sound like you\'re singing in a big empty room when it should feel more intimate. The combo of too loud plus too much echo is washing everything out. Also hearing some background noise in there. Less is more with the reverb on this one - try cutting it in half at least.',
      bestPart: 'Honestly the arrangement doesn\'t need anything changed. It flows really naturally and nothing feels missing or overdone. That\'s actually pretty rare - most people overdo it but you showed good restraint here. The structure works and the instrumentation supports the vocal without competing. That part is solid.',
      weakestPart: 'Vocal is mixed way too loud compared to everything else. It\'s also super reverb-heavy which is making it sound like you\'re singing in a big empty room when it should feel more intimate. The combo of too loud plus too much echo is washing everything out. Also hearing some background noise in there. Less is more with the reverb on this one - try cutting it in half at least.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review 2 created (Sarah - DEMO_STAGE)');

  // Update track stats
  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: { increment: 2 },
      status: track.reviewsCompleted + 2 >= track.reviewsRequested ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: track.reviewsCompleted + 2 >= track.reviewsRequested ? new Date() : null
    }
  });

  console.log('\n✅ Successfully added 2 reviews!');
  console.log(`   Track: ${track.reviewsCompleted + 2}/${track.reviewsRequested} reviews complete`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
