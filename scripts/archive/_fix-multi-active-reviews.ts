/**
 * Find artists with more than 1 ASSIGNED/IN_PROGRESS review and expire the
 * older ones, keeping only the most recently updated one per artist.
 *
 * Run dry-run first (default), then pass --fix to apply.
 * Usage:
 *   npx tsx scripts/_fix-multi-active-reviews.ts          # dry run
 *   npx tsx scripts/_fix-multi-active-reviews.ts --fix    # apply
 */
import { prisma } from "../../src/lib/prisma";

const DRY = !process.argv.includes("--fix");

async function main() {
  console.log(`Mode: ${DRY ? "DRY RUN (pass --fix to apply)" : "APPLYING FIXES"}\n`);

  // Fetch all active reviews grouped by artist
  const activeReviews = await prisma.review.findMany({
    where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
    select: {
      id: true,
      status: true,
      trackId: true,
      peerReviewerArtistId: true,
      updatedAt: true,
      Track: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group by artist
  const byArtist = new Map<string, typeof activeReviews>();
  for (const r of activeReviews) {
    if (!r.peerReviewerArtistId) continue;
    const list = byArtist.get(r.peerReviewerArtistId) ?? [];
    list.push(r);
    byArtist.set(r.peerReviewerArtistId, list);
  }

  const offenders = [...byArtist.entries()].filter(([, list]) => list.length > 1);

  if (offenders.length === 0) {
    console.log("✓ No artists with multiple active reviews. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${offenders.length} artist(s) with multiple active reviews:\n`);

  let totalExpired = 0;

  for (const [artistId, reviews] of offenders) {
    // Already sorted desc by updatedAt — keep index 0, expire the rest
    const [keep, ...expire] = reviews;

    console.log(`Artist ${artistId}`);
    console.log(`  KEEP  [${keep.id}] "${keep.Track.title}" (${keep.status}, updated ${keep.updatedAt.toISOString()})`);
    for (const r of expire) {
      console.log(`  EXPIRE [${r.id}] "${r.Track.title}" (${r.status}, updated ${r.updatedAt.toISOString()})`);
    }

    if (!DRY) {
      const expireIds = expire.map((r) => r.id);
      const expireTrackIds = expire.map((r) => r.trackId);

      await prisma.$transaction([
        // Expire the stale reviews
        prisma.review.updateMany({
          where: { id: { in: expireIds } },
          data: { status: "EXPIRED" },
        }),
        // Remove their ReviewQueue entries
        prisma.reviewQueue.deleteMany({
          where: {
            artistReviewerId: artistId,
            trackId: { in: expireTrackIds },
          },
        }),
      ]);

      console.log(`  → expired ${expireIds.length} review(s) and removed queue entries`);
    }

    totalExpired += expire.length;
    console.log();
  }

  console.log(`\n${DRY ? "Would expire" : "Expired"} ${totalExpired} review(s) across ${offenders.length} artist(s).`);
  if (DRY) console.log("\nRe-run with --fix to apply.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
