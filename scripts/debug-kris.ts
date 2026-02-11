import { prisma } from "../src/lib/prisma";
import { assignReviewersToTrack } from "../src/lib/queue";

async function main() {
  // 1. Find ALL users/profiles with Kris's email (case-insensitive)
  const krisUsers = await prisma.user.findMany({
    where: { email: { contains: "kris.engelhardt4", mode: "insensitive" } },
    include: {
      ArtistProfile: { select: { id: true, artistName: true, completedOnboarding: true, userId: true } },
    },
  });
  console.log("=== ALL KRIS USERS ===");
  for (const u of krisUsers) {
    console.log(`  User ${u.id} | email: ${u.email} | profile: ${u.ArtistProfile?.id} (${u.ArtistProfile?.artistName})`);
  }

  // The correct profile is the one Kris logs in with (Cool Band)
  const correctUser = krisUsers.find(u => u.ArtistProfile?.artistName === "Cool Band");
  const wrongUser = krisUsers.find(u => u.ArtistProfile?.artistName !== "Cool Band" && u.ArtistProfile);

  if (!correctUser?.ArtistProfile) {
    console.log("Can't find Cool Band profile!");
    await prisma.$disconnect();
    return;
  }

  const correctId = correctUser.ArtistProfile.id;
  const wrongId = wrongUser?.ArtistProfile?.id;
  console.log(`\nCorrect profile: ${correctId} (Cool Band)`);
  console.log(`Wrong profile: ${wrongId} (${wrongUser?.ArtistProfile?.artistName})`);

  // 2. Add all umbrella review genres to Kris's CORRECT profile
  const umbrellaGenres = await prisma.genre.findMany({
    where: { slug: { in: ["electronic", "hip-hop-rnb", "rock-metal", "pop-dance", "other"] } },
    select: { id: true, slug: true },
  });
  console.log(`\nFound ${umbrellaGenres.length} umbrella genres: ${umbrellaGenres.map(g => g.slug).join(", ")}`);

  await prisma.artistProfile.update({
    where: { id: correctId },
    data: {
      Genre_ArtistReviewGenres: { set: umbrellaGenres.map(g => ({ id: g.id })) },
    },
  });
  console.log("✓ Set review genres on Cool Band profile");

  // 3. Clear ALL existing seed track assignments
  const seedTracks = await prisma.track.findMany({
    where: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
    select: { id: true, title: true },
  });
  const seedTrackIds = seedTracks.map(t => t.id);

  const delQ = await prisma.reviewQueue.deleteMany({ where: { trackId: { in: seedTrackIds } } });
  const delR = await prisma.review.deleteMany({ where: { trackId: { in: seedTrackIds } } });
  console.log(`\nCleared ${delQ.count} queue + ${delR.count} reviews from seed tracks`);

  // 4. Also clear review genres from the wrong profile so it doesn't compete
  if (wrongId) {
    await prisma.artistProfile.update({
      where: { id: wrongId },
      data: { Genre_ArtistReviewGenres: { set: [] } },
    });
    console.log(`✓ Cleared review genres from wrong profile (${wrongId})`);
  }

  // 5. Re-run assignment
  console.log(`\nAssigning ${seedTracks.length} tracks...`);
  for (const t of seedTracks) {
    try {
      await assignReviewersToTrack(t.id);
      console.log(`  ✓ ${t.title}`);
    } catch (err: any) {
      console.warn(`  ⚠ ${t.title}: ${err.message}`);
    }
  }

  // 6. Verify
  const krisReviews = await prisma.review.count({
    where: { peerReviewerArtistId: correctId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
  });
  console.log(`\n=== RESULT ===`);
  console.log(`Kris (Cool Band) pending reviews: ${krisReviews}`);

  await prisma.$disconnect();
}
main();
