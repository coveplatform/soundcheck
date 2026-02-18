require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function check() {
  const track = await prisma.track.findFirst({
    where: { title: { contains: 'Australia' } },
    include: {
      Review: {
        select: {
          id: true,
          status: true,
          ReviewerProfile: {
            select: {
              User: { select: { email: true } }
            }
          },
          ArtistProfile: {
            select: {
              User: { select: { email: true } }
            }
          }
        }
      }
    }
  });

  console.log('Track:', track.title);
  console.log('reviewsCompleted field:', track.reviewsCompleted);
  console.log('reviewsRequested field:', track.reviewsRequested);
  console.log('\nActual reviews in database:');
  track.Review.forEach((r, i) => {
    const email = r.ReviewerProfile?.User?.email || r.ArtistProfile?.User?.email || 'unknown';
    console.log('  ' + (i+1) + '. ' + email + ' - ' + r.status);
  });
  console.log('\nTotal review count:', track.Review.length);
}

check().finally(() => prisma.$disconnect());
