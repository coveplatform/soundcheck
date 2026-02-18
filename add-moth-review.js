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
  console.log('🎵 Adding review for Moth - Distinguished Thoughts...\n');

  // Find track - use specific ID to avoid wrong Moth track
  const track = await prisma.track.findUnique({
    where: { id: 'cmlo8vznk000004inbqouh06m' }
  });

  if (!track) {
    throw new Error('Track not found');
  }

  console.log(`✓ Found track: "${track.title}" (${track.id})\n`);

  // Get reviewer
  const email = 'alexkimbeats@gmail.com';
  const name = 'Alex Kim';
  const passwordHash = bcrypt.hashSync('demo123456', 10);

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

  console.log('\n📝 Creating review...\n');

  // Review - Alex Kim
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: user.ReviewerProfile.id,
      status: 'COMPLETED',
      firstImpression: 'STRONG_HOOK',
      wouldListenAgain: true,
      productionScore: 4,
      vocalScore: 2,
      originalityScore: 4,
      qualityLevel: 'ALMOST_THERE',
      nextFocus: 'MIXING',
      playlistAction: 'LET_PLAY',
      lowEndClarity: 'PERFECT',
      stereoWidth: 'GOOD_BALANCE',
      vocalClarity: 'BURIED',
      highEndQuality: 'PERFECT',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Turn the vocal up by like 3-4dB. The flow is there but I can barely hear what you\'re saying over the beat. Easy fix that\'ll make this way more listenable.',
      biggestWeaknessSpecific: 'The beat is honestly sick but the vocal is way too quiet in the mix. I\'m straining to hear the lyrics and that\'s a problem for a rap track where the words matter. The vocal needs to sit on top of the beat, not buried underneath it. Bring it up and maybe add a bit of presence around 3-5kHz so it cuts through without sounding harsh. Right now the production is carrying but the vocal performance is getting lost.',
      bestPart: 'The beat selection is fire. Syndrome killed it with the production - the drums hit hard, the melody is catchy, and the overall vibe fits the style perfectly. Your delivery and timing work well with the beat when I can actually hear you. You clearly know how to rap over this type of production, just need to make sure people can actually hear what you\'re saying.',
      weakestPart: 'The beat is honestly sick but the vocal is way too quiet in the mix. I\'m straining to hear the lyrics and that\'s a problem for a rap track where the words matter. The vocal needs to sit on top of the beat, not buried underneath it. Bring it up and maybe add a bit of presence around 3-5kHz so it cuts through without sounding harsh. Right now the production is carrying but the vocal performance is getting lost.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review created (Alex - ALMOST_THERE)');

  // Update track stats
  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: { increment: 1 },
      status: track.reviewsCompleted + 1 >= track.reviewsRequested ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: track.reviewsCompleted + 1 >= track.reviewsRequested ? new Date() : null
    }
  });

  console.log('\n✅ Successfully added 1 review!');
  console.log(`   Track: ${track.reviewsCompleted + 1}/${track.reviewsRequested} reviews complete`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
