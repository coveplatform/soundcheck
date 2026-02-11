import { prisma } from "../src/lib/prisma";

async function main() {
  // Get all real users (non-seed)
  const realUsers = await prisma.user.findMany({
    where: { email: { not: { endsWith: "@seed.mixreflect.com" } } },
    select: {
      id: true,
      email: true,
      ArtistProfile: { select: { id: true, artistName: true } },
    },
  });

  console.log(`Real users: ${realUsers.length}`);
  for (const u of realUsers) {
    const apId = u.ArtistProfile?.id;
    if (!apId) {
      console.log(`  ${u.email} - no artist profile`);
      continue;
    }

    // Count available tracks for this user using same logic as /review page
    const claimedTrackIds = await prisma.review.findMany({
      where: { peerReviewerArtistId: apId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      select: { trackId: true },
    });
    const pastTrackIds = await prisma.review.findMany({
      where: { peerReviewerArtistId: apId, status: { in: ["COMPLETED", "SKIPPED", "EXPIRED"] } },
      select: { trackId: true },
    });
    const excludeIds = [
      ...claimedTrackIds.map((r) => r.trackId),
      ...pastTrackIds.map((r) => r.trackId),
    ];

    const available = await prisma.track.findMany({
      where: {
        packageType: "PEER",
        status: { in: ["QUEUED", "IN_PROGRESS"] },
        artistId: { not: apId },
        id: { notIn: excludeIds },
      },
      select: { id: true, title: true, reviewsRequested: true, artistId: true,
        _count: { select: { Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } } } } },
    });

    const filtered = available.filter((t) => t._count.Review < t.reviewsRequested);

    // Count how many tracks this user owns
    const ownedTracks = await prisma.track.count({
      where: { artistId: apId, packageType: "PEER", status: { in: ["QUEUED", "IN_PROGRESS"] } },
    });

    console.log(`  ${u.email} (${u.ArtistProfile?.artistName}) - sees ${filtered.length} tracks, owns ${ownedTracks}, excluded ${excludeIds.length}`);
  }

  // Also check: how many unique artistIds own seed tracks?
  const seedArtistIds = await prisma.track.findMany({
    where: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
    select: { artistId: true },
    distinct: ["artistId"],
  });
  console.log(`\nSeed tracks owned by ${seedArtistIds.length} different artist profiles`);

  await prisma.$disconnect();
}
main();
