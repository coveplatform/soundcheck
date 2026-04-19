import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });

// All tracks completed in this session — clean up any lingering assigns/queue entries
const ARTIST_TRACKS: { email: string; titleFragment: string }[] = [
  { email: "jesusgirlarchive@gmail.com", titleFragment: "good deal" },
  { email: "afiguera@gmail.com", titleFragment: "Cyberpunk" },
  { email: "sean.ogilvie@aol.com", titleFragment: "Grim Grey" },
  { email: "ppepon788@gmail.com", titleFragment: "Groovin" },
  { email: "the7thparadox.band@gmail.com", titleFragment: "Space of Fear" },
  { email: "rellval06@gmail.com", titleFragment: "<3" },
  { email: "turnertn931@gmail.com", titleFragment: "2ki4cqYtODEEzL19dk" },
  { email: "concordiabandofficial@gmail.com", titleFragment: "Deliver Us" },
];

async function main() {
  for (const { email, titleFragment } of ARTIST_TRACKS) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) { console.log(`[SKIP] No user: ${email}`); continue; }

    const ap = await prisma.artistProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!ap) { console.log(`[SKIP] No profile: ${email}`); continue; }

    const track = await prisma.track.findFirst({
      where: { artistId: ap.id, title: { contains: titleFragment, mode: "insensitive" } },
      select: { id: true, title: true },
    });
    if (!track) { console.log(`[SKIP] No track matching "${titleFragment}" for ${email}`); continue; }

    // Expire any stale ASSIGNED or IN_PROGRESS reviews (non-completed)
    const staleReviews = await prisma.review.findMany({
      where: { trackId: track.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      select: { id: true },
    });

    if (staleReviews.length > 0) {
      await prisma.review.updateMany({
        where: { trackId: track.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        data: { status: "EXPIRED" },
      });
      console.log(`  [EXPIRED] ${staleReviews.length} stale review(s) on "${track.title}"`);
    }

    // Wipe the entire ReviewQueue for this track
    const deleted = await prisma.reviewQueue.deleteMany({
      where: { trackId: track.id },
    });

    if (deleted.count > 0) {
      console.log(`  [CLEARED] ${deleted.count} queue entry/entries on "${track.title}"`);
    } else {
      console.log(`  [CLEAN] No queue entries on "${track.title}"`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
