import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });

const ALLOWED = new Set([
  "i.ytimg.com", "i1.sndcdn.com", "f4.bcbits.com", "images.unsplash.com",
  "picsum.photos", "fastly.picsum.photos", "d1gm7q4p33g3v8.cloudfront.net",
]);

async function main() {
  // Tracks that surface in the "Review & Earn" ClaimCard queue
  const queue = await prisma.track.findMany({
    where: { packageType: "PEER", status: { in: ["QUEUED", "IN_PROGRESS"] }, abTestPrimaryTrackId: null },
    select: { id: true, title: true, artworkUrl: true, status: true },
  });

  const badInQueue = queue.filter((t) => {
    if (!t.artworkUrl) return false;
    try { return !ALLOWED.has(new URL(t.artworkUrl).hostname); } catch { return true; }
  });

  // Count hosts across ALL tracks for context
  const all = await prisma.track.findMany({ where: { artworkUrl: { not: null } }, select: { artworkUrl: true } });
  const hostCounts = new Map<string, number>();
  for (const t of all) {
    try { const h = new URL(t.artworkUrl!).hostname; hostCounts.set(h, (hostCounts.get(h) ?? 0) + 1); } catch { hostCounts.set("(invalid)", (hostCounts.get("(invalid)") ?? 0) + 1); }
  }

  console.log("=== Active PEER queue tracks:", queue.length, "===");
  console.log("=== With UNCONFIGURED artwork host (would crash ClaimCard):", badInQueue.length, "===");
  for (const t of badInQueue) console.log(`  • ${t.status}  ${t.title}  → ${t.artworkUrl}`);
  console.log("\n=== All artwork hosts in DB ===");
  for (const [h, c] of [...hostCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ALLOWED.has(h) ? "OK " : "BAD"}  ${c.toString().padStart(4)}  ${h}`);
  }
}
main().finally(() => prisma.$disconnect());
