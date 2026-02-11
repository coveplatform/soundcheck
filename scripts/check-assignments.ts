import { prisma } from "../src/lib/prisma";

async function main() {
  // 1. All users with ArtistProfiles that have review genres (eligible for peer reviews)
  const eligible = await prisma.artistProfile.findMany({
    where: {
      completedOnboarding: true,
      Genre_ArtistReviewGenres: { some: {} },
    },
    select: {
      id: true,
      artistName: true,
      User: { select: { email: true } },
      Genre_ArtistReviewGenres: { select: { slug: true } },
    },
  });

  console.log(`=== ELIGIBLE PEER REVIEWERS (${eligible.length}) ===`);
  for (const ap of eligible) {
    const pending = await prisma.review.count({
      where: { peerReviewerArtistId: ap.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
    });
    console.log(`  ${ap.User.email} (${ap.artistName}): ${pending} pending reviews | genres: ${ap.Genre_ArtistReviewGenres.map(g => g.slug).join(", ")}`);
  }

  // 2. All users with ArtistProfiles but NO review genres
  const noGenres = await prisma.artistProfile.findMany({
    where: {
      completedOnboarding: true,
      Genre_ArtistReviewGenres: { none: {} },
      User: { email: { not: { endsWith: "@seed.mixreflect.com" } } },
    },
    select: {
      id: true,
      artistName: true,
      User: { select: { email: true } },
    },
  });

  console.log(`\n=== USERS WITH NO REVIEW GENRES (${noGenres.length}) ===`);
  for (const ap of noGenres) {
    console.log(`  ${ap.User.email} (${ap.artistName})`);
  }

  // 3. Seed track assignment summary
  const seedReviews = await prisma.review.findMany({
    where: {
      Track: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    select: { peerReviewerArtistId: true },
  });

  const byReviewer: Record<string, number> = {};
  for (const r of seedReviews) {
    const key = r.peerReviewerArtistId ?? "null";
    byReviewer[key] = (byReviewer[key] || 0) + 1;
  }

  console.log(`\n=== SEED TRACK ASSIGNMENTS (${seedReviews.length} total) ===`);
  for (const [id, count] of Object.entries(byReviewer)) {
    const ap = id !== "null" ? await prisma.artistProfile.findUnique({
      where: { id },
      select: { artistName: true, User: { select: { email: true } } },
    }) : null;
    console.log(`  ${ap?.User.email ?? "null"} (${ap?.artistName ?? "?"}): ${count}`);
  }

  // 4. Seed tracks still needing more reviewers
  const seedTracks = await prisma.track.findMany({
    where: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
    select: { id: true, title: true, reviewsRequested: true, _count: { select: { Review: true } } },
  });

  const underAssigned = seedTracks.filter(t => t._count.Review < t.reviewsRequested);
  console.log(`\n=== UNDER-ASSIGNED TRACKS (${underAssigned.length}/${seedTracks.length}) ===`);
  if (underAssigned.length > 0) {
    console.log(`  Each track requests ${seedTracks[0]?.reviewsRequested} reviews but only has ${seedTracks[0]?._count.Review}`);
    console.log(`  (Only ${Object.keys(byReviewer).length} eligible reviewers found — need more users with review genres)`);
  }

  await prisma.$disconnect();
}
main();
