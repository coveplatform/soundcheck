/**
 * One-shot fixup — injects exactly 1 review into each of the 5 tracks
 * that came out incomplete from seed-targeted-reviews.ts (cursor-skip bug).
 *
 * Usage: npx tsx prisma/seed-fixup.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("Database URL is not defined");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TARGETS = [
  { email: "kornking05@gmail.com",     title: "Tried My Best - Shiftyy - Sad Rap" },
  { email: "shadowvonnyx@gmail.com",   title: "Genocidal Parasite - Guitar Playthrough. #speedmetal #gothicmetal #thrashmetal" },
  { email: "boh123321@gmail.com",      title: "NAND by Yuki Extremity" },
  { email: "vittearossi@gmail.com",    title: "Юность (Remsatered 2025)" },
  { email: "jimmysrighteye@gmail.com", title: "Cardholder Not Present" },
];

const SEED_REVIEWERS = [
  { name: "Marcus Chen",      email: "seed-reviewer-1@soundcheck.internal" },
  { name: "Zara Williams",    email: "seed-reviewer-2@soundcheck.internal" },
  { name: "Leo Martinez",     email: "seed-reviewer-3@soundcheck.internal" },
  { name: "Priya Sharma",     email: "seed-reviewer-4@soundcheck.internal" },
  { name: "Jordan Blake",     email: "seed-reviewer-5@soundcheck.internal" },
  { name: "Aaliyah Robinson", email: "seed-reviewer-6@soundcheck.internal" },
  { name: "Kai Nakamura",     email: "seed-reviewer-7@soundcheck.internal" },
  { name: "Sofia Rossi",      email: "seed-reviewer-8@soundcheck.internal" },
  { name: "Ethan Wright",     email: "seed-reviewer-9@soundcheck.internal" },
  { name: "Maya Johnson",     email: "seed-reviewer-10@soundcheck.internal" },
];

// Use review #3 (neutral, arrangement feedback) for variety
const CONTENT = {
  firstImpression: "DECENT" as const,
  productionScore: 3,
  vocalScore: 3,
  originalityScore: 4,
  wouldListenAgain: true,
  wouldAddToPlaylist: false,
  wouldShare: false,
  wouldFollow: true,
  perceivedGenre: "Electronic",
  similarArtists: "Four Tet, Bicep, Floating Points",
  bestPart:
    "The sound design is interesting, you can tell theres thought behind the choices. Some of the textural elements work really nicely and give it its own character. The low end is controlled. Got potential, the ideas are there.",
  weakestPart:
    "The arrangement is where it loses me a bit, some sections feel like they go on a bit too long without enough variation to keep the ear interested. The mix also needs work in the mids, there's some frequency buildup around 500hz that's making it sound a bit boxy.",
  additionalNotes:
    "The creative direction is solid, just needs tightening up technically and arrangement-wise. Worth investing time in the mix before putting it out.",
  nextActions:
    "Tighten the arrangement, cut sections that aren't developing. Clean up around 500hz. Reference against similar tracks in the genre.",
  addressedArtistNote: "PARTIALLY" as const,
  timestamps: [
    { seconds: 80,  note: "interesting texture here" },
    { seconds: 150, note: "this section could be shorter" },
  ],
};

async function main() {
  const passwordHash = await hash("SeedReviewer123!", 10);
  const genres = await prisma.genre.findMany({ take: 5 });

  // Ensure all reviewer accounts exist
  const reviewerProfiles: { id: string; name: string }[] = [];
  for (const r of SEED_REVIEWERS) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name },
      create: {
        email: r.email,
        password: passwordHash,
        name: r.name,
        isArtist: true,
        isReviewer: true,
        emailVerified: new Date(),
      },
    });
    const ap = await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        artistName: r.name,
        completedOnboarding: true,
        reviewCredits: 5,
        totalPeerReviews: Math.floor(Math.random() * 30) + 5,
        peerReviewRating: parseFloat((4.0 + Math.random() * 0.8).toFixed(2)),
        Genre_ArtistGenres: { connect: genres.slice(0, 3).map((g) => ({ id: g.id })) },
      },
    });
    reviewerProfiles.push({ id: ap.id, name: r.name });
  }

  console.log(`\nReviewers ready: ${reviewerProfiles.length}\n`);

  let totalInjected = 0;

  for (const target of TARGETS) {
    const user = await prisma.user.findUnique({
      where: { email: target.email },
      include: { ArtistProfile: true },
    });

    if (!user?.ArtistProfile) {
      console.log(`SKIP — user not found: ${target.email}`);
      continue;
    }

    const track = await prisma.track.findFirst({
      where: {
        artistId: user.ArtistProfile.id,
        title: target.title,
        status: { in: ["QUEUED", "IN_PROGRESS", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!track) {
      console.log(`SKIP — track not found: "${target.title}" (${target.email})`);
      continue;
    }

    console.log(`\nTrack: "${track.title}"`);
    console.log(`  Artist:  ${user.ArtistProfile.artistName}`);
    console.log(`  Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

    // Try each reviewer in order until one hasn't reviewed this track
    let injected = false;
    for (const reviewer of reviewerProfiles) {
      const exists = await prisma.review.findFirst({
        where: { trackId: track.id, peerReviewerArtistId: reviewer.id },
      });
      if (exists) {
        console.log(`  Skipped  ${reviewer.name} — already reviewed`);
        continue;
      }

      const hoursAgo = Math.floor(Math.random() * 18) + 1;
      const reviewDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const idx = totalInjected + 1;

      await prisma.review.create({
        data: {
          trackId: track.id,
          peerReviewerArtistId: reviewer.id,
          reviewerId: null,
          isPeerReview: true,
          status: "COMPLETED",
          listenDuration: 185 + Math.floor(Math.random() * 120),
          firstImpression: CONTENT.firstImpression,
          productionScore: CONTENT.productionScore,
          vocalScore: CONTENT.vocalScore,
          originalityScore: CONTENT.originalityScore,
          wouldListenAgain: CONTENT.wouldListenAgain,
          wouldAddToPlaylist: CONTENT.wouldAddToPlaylist,
          wouldShare: CONTENT.wouldShare,
          wouldFollow: CONTENT.wouldFollow,
          perceivedGenre: CONTENT.perceivedGenre,
          similarArtists: CONTENT.similarArtists,
          bestPart: CONTENT.bestPart,
          weakestPart: CONTENT.weakestPart,
          additionalNotes: CONTENT.additionalNotes,
          nextActions: CONTENT.nextActions,
          addressedArtistNote: CONTENT.addressedArtistNote,
          timestamps: CONTENT.timestamps,
          paidAmount: 0,
          artistRating: 4,
          isGem: false,
          countsTowardAnalytics: true,
          countsTowardCompletion: true,
          shareId: `fix${idx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        },
      });

      const newCompleted = track.reviewsCompleted + 1;
      const isDone = newCompleted >= track.reviewsRequested && track.reviewsRequested > 0;
      await prisma.track.update({
        where: { id: track.id },
        data: {
          reviewsCompleted: newCompleted,
          status: isDone ? "COMPLETED" : track.status,
          completedAt: isDone ? new Date() : track.completedAt,
        },
      });

      console.log(`  Injected from ${reviewer.name}`);
      if (isDone) console.log(`  → Track marked COMPLETED`);
      injected = true;
      totalInjected++;
      break;
    }

    if (!injected) {
      console.log(`  ERROR — all reviewers already reviewed this track!`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Total reviews injected: ${totalInjected}`);
  console.log(`========================================\n`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
