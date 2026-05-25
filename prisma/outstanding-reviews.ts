import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      status: 'IN_PROGRESS',
    },
    select: {
      id: true,
      title: true,
      reviewsCompleted: true,
      reviewsRequested: true,
      createdAt: true,
      ArtistProfile: {
        select: {
          artistName: true,
          User: { select: { email: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const outstanding = tracks.filter(t => t.reviewsCompleted < t.reviewsRequested);

  console.log(`\nTotal outstanding: ${outstanding.length}\n`);
  for (const t of outstanding) {
    const remaining = t.reviewsRequested - t.reviewsCompleted;
    console.log(`Artist: ${t.ArtistProfile?.artistName} (${t.ArtistProfile?.User?.email})`);
    console.log(`  Track: "${t.title}" (${t.id})`);
    console.log(`  Progress: ${t.reviewsCompleted}/${t.reviewsRequested} (${remaining} remaining)`);
    console.log();
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
