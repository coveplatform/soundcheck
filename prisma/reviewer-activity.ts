import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

async function main() {
  // Find the top real reviewers' artist profile IDs
  const topUsers = [
    { email: 'djjcar@gmail.com', name: 'Johann Caruana' },
    { email: 'yousign71@gmail.com', name: 'Kerian Jones' },
    { email: 'jimmysrighteye@gmail.com', name: 'DJ Cold' },
  ];

  for (const user of topUsers) {
    const u = await prisma.user.findUnique({
      where: { email: user.email },
      select: { ArtistProfile: { select: { id: true } } },
    });
    const artistId = u?.ArtistProfile?.id;
    if (!artistId) { console.log(`${user.name}: no artist profile`); continue; }

    const reviews = await prisma.review.findMany({
      where: { peerReviewerArtistId: artistId, status: 'COMPLETED' },
      select: { createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    // Group by calendar day (UTC)
    const byDay: Record<string, number> = {};
    for (const r of reviews) {
      const day = r.updatedAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    console.log(`\n${user.name} (${user.email}) — ${reviews.length} total reviews`);
    console.log('  First review:', reviews[0]?.updatedAt.toISOString().slice(0, 10));
    console.log('  Last review: ', reviews[reviews.length - 1]?.updatedAt.toISOString().slice(0, 10));
    console.log('  By day:');
    for (const [day, count] of Object.entries(byDay)) {
      const bar = '█'.repeat(count);
      console.log(`    ${day}  ${bar} (${count})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
