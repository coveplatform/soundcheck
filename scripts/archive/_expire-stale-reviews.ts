import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const DRY_RUN = process.argv.includes("--dry-run");
const STALE_HOURS = 24;

async function main() {
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const stale = await prisma.review.findMany({
    where: {
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      isPeerReview: true,
      updatedAt: { lt: cutoff },
    },
    select: {
      id: true,
      trackId: true,
      status: true,
      updatedAt: true,
      peerReviewerArtistId: true,
      Track: { select: { title: true, status: true } },
      ArtistProfile: { select: { User: { select: { email: true } } } },
    },
    orderBy: { updatedAt: "asc" },
  });

  if (stale.length === 0) {
    console.log("No stale reviews found. All clear.");
    return;
  }

  console.log(`Found ${stale.length} stale review(s) (last activity >24h ago)${DRY_RUN ? " — DRY RUN" : ""}:\n`);

  for (const r of stale) {
    const hoursStale = ((Date.now() - r.updatedAt.getTime()) / 3_600_000).toFixed(1);
    console.log(`  [${r.status}] "${r.Track.title}" — ${r.ArtistProfile?.User?.email ?? "?"} — ${hoursStale}h stale`);
  }

  if (DRY_RUN) {
    console.log("\n--- DRY RUN: no changes made. Re-run without --dry-run to apply. ---");
    return;
  }

  console.log("\nExpiring...\n");

  let expired = 0;
  let tracksReset = 0;
  let tracksLeftAsIs = 0;
  const errors: string[] = [];

  for (const r of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Expire the review
        await tx.review.update({
          where: { id: r.id },
          data: { status: "EXPIRED" },
        });

        // 2. Remove from ReviewQueue
        await tx.reviewQueue.deleteMany({
          where: {
            trackId: r.trackId,
            artistReviewerId: r.peerReviewerArtistId!,
          },
        });

        // 3. Count remaining non-expired reviews for this track
        const remaining = await tx.review.count({
          where: {
            trackId: r.trackId,
            status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
          },
        });

        // 4. If track was IN_PROGRESS and now has nothing left, put it back to QUEUED
        const track = await tx.track.findUnique({
          where: { id: r.trackId },
          select: { status: true },
        });

        if (remaining === 0 && track?.status === "IN_PROGRESS") {
          await tx.track.update({
            where: { id: r.trackId },
            data: { status: "QUEUED" },
          });
          tracksReset++;
          console.log(`  [RESET→QUEUED] "${r.Track.title}"`);
        } else {
          tracksLeftAsIs++;
        }
      });

      expired++;
      const email = r.ArtistProfile?.User?.email ?? "?";
      console.log(`  [EXPIRED] "${r.Track.title}" — ${email}`);
    } catch (e: any) {
      const msg = `  [ERROR] review ${r.id}: ${e?.message}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log(`
Done.
  Expired:      ${expired}
  Tracks→QUEUED: ${tracksReset}
  Tracks unchanged: ${tracksLeftAsIs}
  Errors:       ${errors.length}
`);

  if (errors.length > 0) {
    console.error("Errors:\n" + errors.join("\n"));
  }

  // Sanity check: make sure no reviewer is left stuck
  const stillBlocked = await prisma.review.findMany({
    where: {
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      isPeerReview: true,
      updatedAt: { lt: cutoff },
    },
    select: { id: true },
  });

  if (stillBlocked.length > 0) {
    console.warn(`\nWARN: ${stillBlocked.length} stale review(s) still active — check errors above.`);
  } else {
    console.log("Sanity check passed — no stale reviews remain.");
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
