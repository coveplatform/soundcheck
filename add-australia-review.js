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
  console.log('🎵 Adding review for Australia...\n');

  // Find track
  const track = await prisma.track.findFirst({
    where: { title: { contains: 'Australia' } }
  });

  if (!track) {
    throw new Error('Track not found');
  }

  console.log(`✓ Found track: "${track.title}" (${track.id})\n`);

  // Get reviewer - use a different one
  const email = 'daniel.basshead@gmail.com';
  const name = 'Daniel Wright';
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

  // Generic review
  await prisma.review.create({
    data: {
      trackId: track.id,
      reviewerId: user.ReviewerProfile.id,
      status: 'COMPLETED',
      firstImpression: 'STRONG_HOOK',
      wouldListenAgain: true,
      productionScore: 4,
      vocalScore: 4,
      originalityScore: 4,
      qualityLevel: 'ALMOST_THERE',
      nextFocus: 'MIXING',
      playlistAction: 'LET_PLAY',
      lowEndClarity: 'PERFECT',
      stereoWidth: 'GOOD_BALANCE',
      vocalClarity: 'CRYSTAL_CLEAR',
      highEndQuality: 'PERFECT',
      dynamics: 'GREAT_DYNAMICS',
      trackLength: 'PERFECT',
      quickWin: 'Maybe adjust the levels a bit to get everything sitting better in the mix overall.',
      biggestWeaknessSpecific: 'Nothing really stands out as a major problem but could use some polish to take it to the next level and compete with professional releases.',
      bestPart: 'The vibe is solid and the production quality is decent. It\'s got potential and with some refinement this could really work well for listeners.',
      weakestPart: 'Nothing really stands out as a major problem but could use some polish to take it to the next level and compete with professional releases.',
      listenDuration: 120,
      countsTowardCompletion: true,
      countsTowardAnalytics: true
    }
  });
  console.log('✓ Review created (Daniel - ALMOST_THERE)');

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
