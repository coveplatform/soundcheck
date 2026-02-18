require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function remove() {
  // Find the Australia track
  const track = await prisma.track.findFirst({
    where: { title: { contains: 'Australia' } }
  });

  if (!track) {
    console.log('Track not found');
    return;
  }

  // Delete all IN_PROGRESS reviews for this track
  const deleted = await prisma.review.deleteMany({
    where: {
      trackId: track.id,
      status: 'IN_PROGRESS'
    }
  });

  console.log('✓ Removed', deleted.count, 'IN_PROGRESS review(s) from Australia track');

  // Also remove from queue
  const queueDeleted = await prisma.reviewQueue.deleteMany({
    where: {
      trackId: track.id
    }
  });

  console.log('✓ Removed', queueDeleted.count, 'queue assignment(s)');
}

remove().finally(() => prisma.$disconnect());
