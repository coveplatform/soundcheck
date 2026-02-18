require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function fix() {
  const track = await prisma.track.findFirst({
    where: { title: { contains: 'Australia' } }
  });

  console.log('Before:', track.reviewsCompleted, '/', track.reviewsRequested);

  await prisma.track.update({
    where: { id: track.id },
    data: {
      reviewsCompleted: 5,
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  console.log('✓ Fixed: reviewsCompleted = 5/5');
  console.log('✓ Status = COMPLETED');
}

fix().finally(() => prisma.$disconnect());
