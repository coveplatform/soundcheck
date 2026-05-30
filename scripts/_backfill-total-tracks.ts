import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_URL,
  }),
});

async function main() {
  // Count actual tracks per artist from Track table (only tracks that have been submitted = have paidAt set)
  const counts = await db.track.groupBy({
    by: ["artistId"],
    where: { paidAt: { not: null } },
    _count: { id: true },
  });

  console.log(`Backfilling totalTracks for ${counts.length} artists...`);

  let updated = 0;
  for (const { artistId, _count } of counts) {
    await db.artistProfile.update({
      where: { id: artistId },
      data: { totalTracks: _count.id },
    });
    updated++;
  }

  // Zero out any artists with no submitted tracks (in case counter was wrong)
  await db.artistProfile.updateMany({
    where: { id: { notIn: counts.map((c) => c.artistId) } },
    data: { totalTracks: 0 },
  });

  console.log(`Done. Updated ${updated} artist profiles.`);
}

main().catch(console.error).finally(() => db.$disconnect());
