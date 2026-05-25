import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

async function main() {
  const total = await prisma.review.count();
  const peer = await prisma.review.count({ where: { isPeerReview: true } });
  const withPeerArtist = await prisma.review.count({ where: { peerReviewerArtistId: { not: null } } });
  const withReviewerId = await prisma.review.count({ where: { reviewerId: { not: null } } });
  console.log('total reviews:', total);
  console.log('isPeerReview=true:', peer);
  console.log('peerReviewerArtistId set:', withPeerArtist);
  console.log('reviewerId set:', withReviewerId);

  // Artists who have given peer reviews
  const peerReviewers = await prisma.artistProfile.findMany({
    where: { totalPeerReviews: { gt: 0 } },
    select: { artistName: true, totalPeerReviews: true, User: { select: { email: true } } },
    orderBy: { totalPeerReviews: 'desc' },
    take: 15,
  });
  console.log('\nTop artists by peer reviews given (totalPeerReviews):');
  if (peerReviewers.length === 0) {
    console.log('  none');
  } else {
    for (const p of peerReviewers) {
      console.log(`  ${p.totalPeerReviews} | ${p.User?.email} | ${p.artistName}`);
    }
  }

  // ReviewerProfiles with any reviews
  const reviewerProfiles = await prisma.reviewerProfile.findMany({
    where: { totalReviews: { gt: 0 } },
    select: { totalReviews: true, tier: true, User: { select: { email: true, name: true } } },
    orderBy: { totalReviews: 'desc' },
    take: 15,
  });
  console.log('\nTop paid reviewers (totalReviews):');
  if (reviewerProfiles.length === 0) {
    console.log('  none');
  } else {
    for (const p of reviewerProfiles) {
      console.log(`  ${p.totalReviews} | ${p.tier} | ${p.User?.email} | ${p.User?.name ?? ''}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
