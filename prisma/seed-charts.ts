/**
 * Seed script to populate the Daily Chart with fake data for local testing.
 * 
 * Usage:
 *   npx tsx prisma/seed-charts.ts
 * 
 * Creates:
 * - 8 fake chart submissions for today
 * - 5 for yesterday (with a featured winner)
 * - Votes spread across submissions
 * - Uses existing users/tracks if available, otherwise creates seed data
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local first, then .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error("No DATABASE_URL found. Set it in .env.local");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const FAKE_TRACKS = [
  { title: "Midnight Frequency", genre: "Electronic" },
  { title: "Golden Hour Vibes", genre: "Lo-Fi" },
  { title: "Concrete Jungle", genre: "Hip Hop" },
  { title: "Velvet Dreams", genre: "R&B" },
  { title: "Neon Pulse", genre: "Synthwave" },
  { title: "Sunday Morning Coffee", genre: "Indie" },
  { title: "Bass Cathedral", genre: "Dubstep" },
  { title: "Autumn Leaves (Remix)", genre: "House" },
  { title: "Starlight Serenade", genre: "Pop" },
  { title: "Thunder Road", genre: "Rock" },
  { title: "Cloud Nine", genre: "Ambient" },
  { title: "Downtown Shuffle", genre: "Funk" },
  { title: "Crystal Clear", genre: "Trance" },
];

const ARTIST_NAMES = [
  "DJ Nexus",
  "Luna Wave",
  "Concrete Kids",
  "Silk & Honey",
  "Neon Archive",
  "Porch Sessions",
  "SubFreq",
  "AH x Remixes",
  "Stella Nova",
  "Thunder Road Band",
  "Misty Peaks",
  "Groove Machine",
  "Crystal Lake",
];

async function main() {
  console.log("🎵 Seeding Daily Chart data...\n");

  // Get or create seed users + artist profiles
  const seedProfiles: { id: string; userId: string }[] = [];

  for (let i = 0; i < ARTIST_NAMES.length; i++) {
    const email = `chart-seed-${i}@seed.mixreflect.com`;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: ARTIST_NAMES[i],
          isArtist: true,
          isReviewer: true,
          emailVerified: new Date(),
        },
      });
      console.log(`  Created user: ${email}`);
    }

    let profile = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await prisma.artistProfile.create({
        data: {
          userId: user.id,
          artistName: ARTIST_NAMES[i],
          completedOnboarding: true,
          reviewCredits: 5,
        },
      });
      console.log(`  Created profile: ${ARTIST_NAMES[i]}`);
    }

    seedProfiles.push({ id: profile.id, userId: user.id });
  }

  // Create seed tracks (if they don't exist)
  const seedTracks: { id: string; artistId: string; title: string; genre: string }[] = [];

  for (let i = 0; i < FAKE_TRACKS.length; i++) {
    const profile = seedProfiles[i % seedProfiles.length];
    const trackData = FAKE_TRACKS[i];

    // Check if a track with this title already exists for this artist
    const existing = await prisma.track.findFirst({
      where: {
        artistId: profile.id,
        title: trackData.title,
      },
    });

    if (existing) {
      seedTracks.push({
        id: existing.id,
        artistId: profile.id,
        title: trackData.title,
        genre: trackData.genre,
      });
      continue;
    }

    const track = await prisma.track.create({
      data: {
        artistId: profile.id,
        title: trackData.title,
        sourceUrl: `https://soundcloud.com/example/${trackData.title.toLowerCase().replace(/\s+/g, "-")}`,
        sourceType: "SOUNDCLOUD",
        packageType: "PEER",
        reviewsRequested: 3,
        status: "COMPLETED",
      },
    });

    seedTracks.push({
      id: track.id,
      artistId: profile.id,
      title: trackData.title,
      genre: trackData.genre,
    });
    console.log(`  Created track: "${trackData.title}"`);
  }

  // Clear existing chart data for today and yesterday
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  await (prisma as any).chartVote.deleteMany({
    where: {
      ChartSubmission: {
        chartDate: { in: [today, yesterday] },
      },
    },
  });
  await (prisma as any).chartSubmission.deleteMany({
    where: { chartDate: { in: [today, yesterday] } },
  });

  console.log("\n  Cleared existing chart data for today & yesterday.\n");

  // --- Seed TODAY's chart (8 submissions) ---
  const todaySubmissions: any[] = [];
  const todayTracks = seedTracks.slice(0, 8);

  for (const track of todayTracks) {
    const sub = await (prisma as any).chartSubmission.create({
      data: {
        trackId: track.id,
        artistId: track.artistId,
        chartDate: today,
        title: track.title,
        sourceUrl: `https://soundcloud.com/example/${track.title.toLowerCase().replace(/\s+/g, "-")}`,
        sourceType: "SOUNDCLOUD",
        genre: track.genre,
        voteCount: 0,
        playCount: Math.floor(Math.random() * 50) + 5,
      },
    });
    todaySubmissions.push(sub);
    console.log(`  📊 Today: "${track.title}"`);
  }

  // Add votes to today's submissions (varied distribution)
  const voteDistribution = [12, 9, 7, 5, 4, 3, 2, 1]; // #1 gets 12 votes, etc.

  for (let i = 0; i < todaySubmissions.length; i++) {
    const sub = todaySubmissions[i];
    const targetVotes = voteDistribution[i] || 1;

    // Use other seed users as voters (not the submitter)
    const voterProfiles = seedProfiles.filter((p) => p.id !== sub.artistId);

    for (let v = 0; v < Math.min(targetVotes, voterProfiles.length); v++) {
      try {
        await (prisma as any).chartVote.create({
          data: {
            submissionId: sub.id,
            voterId: voterProfiles[v].userId,
            listenDuration: 30 + Math.floor(Math.random() * 120),
          },
        });
      } catch {
        // skip duplicate votes
      }
    }

    // Update vote count
    await (prisma as any).chartSubmission.update({
      where: { id: sub.id },
      data: { voteCount: targetVotes },
    });
  }

  console.log(`  ✅ Added votes to today's ${todaySubmissions.length} submissions\n`);

  // --- Seed YESTERDAY's chart (5 submissions, with featured winner) ---
  const yesterdayTracks = seedTracks.slice(5, 10);
  const yesterdaySubmissions: any[] = [];

  for (const track of yesterdayTracks) {
    const sub = await (prisma as any).chartSubmission.create({
      data: {
        trackId: track.id,
        artistId: track.artistId,
        chartDate: yesterday,
        title: track.title,
        sourceUrl: `https://soundcloud.com/example/${track.title.toLowerCase().replace(/\s+/g, "-")}`,
        sourceType: "SOUNDCLOUD",
        genre: track.genre,
        voteCount: 0,
        playCount: Math.floor(Math.random() * 80) + 10,
      },
    });
    yesterdaySubmissions.push(sub);
    console.log(`  📊 Yesterday: "${track.title}"`);
  }

  // Votes for yesterday
  const yVoteDistribution = [15, 11, 8, 4, 2];
  for (let i = 0; i < yesterdaySubmissions.length; i++) {
    const sub = yesterdaySubmissions[i];
    const targetVotes = yVoteDistribution[i] || 1;

    const voterProfiles = seedProfiles.filter((p) => p.id !== sub.artistId);
    for (let v = 0; v < Math.min(targetVotes, voterProfiles.length); v++) {
      try {
        await (prisma as any).chartVote.create({
          data: {
            submissionId: sub.id,
            voterId: voterProfiles[v].userId,
            listenDuration: 30 + Math.floor(Math.random() * 120),
          },
        });
      } catch {
        // skip duplicate votes
      }
    }

    await (prisma as any).chartSubmission.update({
      where: { id: sub.id },
      data: {
        voteCount: targetVotes,
        rank: i + 1,
        isFeatured: i === 0,
      },
    });
  }

  console.log(`  ✅ Added votes to yesterday's ${yesterdaySubmissions.length} submissions\n`);
  console.log("🎉 Chart seed complete!");
  console.log(`   Today: ${todaySubmissions.length} submissions`);
  console.log(`   Yesterday: ${yesterdaySubmissions.length} submissions (winner: "${yesterdayTracks[0]?.title}")`);
  console.log("\n   Visit /charts to see the Daily Chart!\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
