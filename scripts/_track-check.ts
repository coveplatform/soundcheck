import { prisma } from "../src/lib/prisma";

async function main() {
  const seedFilter = { NOT: { email: { endsWith: "@seed.mixreflect.com" } } };

  // Pro users and their slot usage
  const proUsers = await prisma.artistProfile.findMany({
    where: { subscriptionStatus: "active", User: seedFilter },
    select: {
      artistName: true,
      _count: { select: { Track: true } },
      Track: {
        select: { status: true },
      },
    },
  });

  const proStats = proUsers.map(u => ({
    artistName: u.artistName,
    totalTracks: u._count.Track,
    activeSlots: u.Track.filter(t => ["QUEUED","IN_PROGRESS","PENDING_PAYMENT"].includes(t.status)).length,
    uploaded: u.Track.filter(t => t.status === "UPLOADED").length,
    completed: u.Track.filter(t => t.status === "COMPLETED").length,
  }));

  // Free users track count distribution
  const freeUsers = await prisma.artistProfile.findMany({
    where: { subscriptionStatus: { not: "active" }, User: seedFilter },
    select: { _count: { select: { Track: true } } },
  });
  const dist: Record<number, number> = {};
  for (const u of freeUsers) {
    const n = u._count.Track;
    dist[n] = (dist[n] || 0) + 1;
  }

  console.log("PRO USERS:");
  console.log(JSON.stringify(proStats, null, 2));
  console.log("\nFREE USER TRACK DISTRIBUTION:");
  console.log(JSON.stringify(dist, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
