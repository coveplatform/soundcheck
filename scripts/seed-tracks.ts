/**
 * Seed script: populate the review queue with real tracks.
 *
 * Folder structure:
 *   seed-tracks/
 *     electronic/   → matched to Electronic umbrella + sub-genres
 *     hiphop/       → matched to Hip-Hop & R&B umbrella + sub-genres
 *     pop/          → matched to Pop & Dance umbrella + sub-genres
 *     rock/         → matched to Rock & Metal umbrella + sub-genres
 *     other/        → matched to Other umbrella + sub-genres
 *
 * File naming: "Artist Name - Track Title.mp3"
 *
 * Usage:
 *   1. Drop MP3 files into the genre subfolders
 *   2. Set env vars: DATABASE_URL, UPLOADS_S3_BUCKET, UPLOADS_S3_REGION,
 *      UPLOADS_S3_ACCESS_KEY_ID, UPLOADS_S3_SECRET_ACCESS_KEY, UPLOADS_PUBLIC_BASE_URL
 *   3. Run:  npx tsx scripts/seed-tracks.ts
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { randomBytes } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { assignReviewersToTrack } from "../src/lib/queue";

// ---------------------------------------------------------------------------
// Folder → genre slug mapping (umbrella + random sub-genre per track)
// ---------------------------------------------------------------------------
const FOLDER_GENRES: Record<string, { umbrella: string; subGenres: string[] }> = {
  electronic: {
    umbrella: "electronic",
    subGenres: ["house", "deep-house", "techno", "synthwave", "edm", "future-bass", "trance", "lo-fi", "drum-and-bass", "progressive-house", "minimal"],
  },
  hiphop: {
    umbrella: "hip-hop-rnb",
    subGenres: ["hip-hop", "trap", "rnb", "boom-bap", "drill", "phonk", "lo-fi-hip-hop"],
  },
  pop: {
    umbrella: "pop-dance",
    subGenres: ["pop", "indie-pop", "electropop", "synth-pop", "bedroom-pop", "dream-pop"],
  },
  rock: {
    umbrella: "rock-metal",
    subGenres: ["rock", "indie-rock", "metal", "punk", "alternative", "metalcore"],
  },
  other: {
    umbrella: "other",
    subGenres: ["jazz", "soul", "funk", "folk", "singer-songwriter", "classical", "experimental", "reggae", "world"],
  },
};

// Feedback focus templates per genre folder
const FOCUS_TEMPLATES: Record<string, string[]> = {
  electronic: [
    "How's the mix balance? Does the low end cut through?",
    "Drop impact — does it hit hard enough?",
    "Synth layering and texture — cohesive or cluttered?",
    "Build-up tension and release. Does the arrangement flow?",
    "Bassline groove and overall energy. Club-ready?",
    "Sound design and atmosphere. Is it immersive?",
    "Frequency balance — any clashes or muddy areas?",
    "Melodic hooks — memorable enough?",
  ],
  hiphop: [
    "Vocal mix — does it sit right? 808 punch?",
    "Flow and delivery feedback. Does the rhythm hit?",
    "Sample chops and overall groove. Kick pattern?",
    "Bass and low end. Hard enough for the car?",
    "Beat structure and arrangement. Too repetitive?",
    "Hook strength — is it catchy?",
    "Lyrical clarity vs the instrumental balance.",
  ],
  pop: [
    "Is the chorus catchy enough? Hook strength?",
    "Production polish — radio-ready?",
    "Vocal clarity and presence in the mix.",
    "Arrangement flow — does the bridge work?",
    "Overall vibe and emotional impact.",
    "Is it too busy or just right?",
  ],
  rock: [
    "Guitar tone and overall energy. Too compressed?",
    "Drum punch and mix balance.",
    "Does the breakdown land?",
    "Vocal energy and presence in the mix.",
    "Overall arrangement — does it build properly?",
    "Raw energy vs polish — right balance?",
  ],
  other: [
    "Vocal emotion and instrument interplay.",
    "Atmosphere and feel — does it convey the mood?",
    "Arrangement and pacing. Too long or just right?",
    "Mix clarity — can you hear every element?",
    "Overall vibe — what feeling does it leave you with?",
  ],
};

// ---------------------------------------------------------------------------
// S3 helpers
// ---------------------------------------------------------------------------
function getS3Client() {
  const region = process.env.UPLOADS_S3_REGION;
  const accessKeyId = process.env.UPLOADS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.UPLOADS_S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.UPLOADS_S3_ENDPOINT;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 env vars: UPLOADS_S3_REGION, UPLOADS_S3_ACCESS_KEY_ID, UPLOADS_S3_SECRET_ACCESS_KEY");
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function uploadToS3(s3: S3Client, bucket: string, filePath: string): Promise<string> {
  const body = readFileSync(filePath);
  const key = `tracks/${randomBytes(16).toString("hex")}.mp3`;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "audio/mpeg",
  }));

  const baseUrl = (process.env.UPLOADS_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  return `${baseUrl}/${key}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseFilename(filename: string): { artistName: string; title: string } {
  const name = filename.replace(/\.mp3$/i, "");
  const parts = name.split(" - ");
  if (parts.length >= 2) {
    return { artistName: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artistName: name, title: name };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const bucket = process.env.UPLOADS_S3_BUCKET;
  const publicBaseUrl = process.env.UPLOADS_PUBLIC_BASE_URL;

  if (!bucket || !publicBaseUrl) {
    throw new Error("Missing env: UPLOADS_S3_BUCKET, UPLOADS_PUBLIC_BASE_URL");
  }

  const seedDir = join(__dirname, "..", "seed-tracks");
  if (!existsSync(seedDir)) {
    console.error(`\n❌ No seed-tracks/ folder found.\n`);
    process.exit(1);
  }

  // 1. Collect all MP3s from subfolders
  type TrackEntry = { filePath: string; folder: string; artistName: string; title: string };
  const entries: TrackEntry[] = [];

  for (const folder of Object.keys(FOLDER_GENRES)) {
    const folderPath = join(seedDir, folder);
    if (!existsSync(folderPath)) continue;

    const files = readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith(".mp3"))
      .sort();

    for (const file of files) {
      const { artistName, title } = parseFilename(file);
      entries.push({
        filePath: join(folderPath, file),
        folder,
        artistName,
        title,
      });
    }
  }

  if (entries.length === 0) {
    console.error(`\n❌ No MP3 files found in seed-tracks/ subfolders.\n`);
    process.exit(1);
  }

  console.log(`Found ${entries.length} tracks across ${new Set(entries.map((e) => e.folder)).size} genre folders\n`);

  // 2. Load genre map
  const allGenres = await prisma.genre.findMany({ select: { id: true, slug: true } });
  const genreMap = new Map(allGenres.map((g) => [g.slug, g.id]));

  const s3 = getS3Client();
  const createdTrackIds: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const folderGenres = FOLDER_GENRES[entry.folder];
    const focusTemplates = FOCUS_TEMPLATES[entry.folder] ?? FOCUS_TEMPLATES.other;

    console.log(`[${i + 1}/${entries.length}] ${entry.artistName} — "${entry.title}" (${entry.folder})`);

    // 3. Upload MP3 to S3
    console.log(`  Uploading...`);
    const sourceUrl = await uploadToS3(s3, bucket, entry.filePath);
    console.log(`  → ${sourceUrl}`);

    // 4. Create User + ArtistProfile
    const email = `${entry.artistName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@seed.mixreflect.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: entry.artistName,
        emailVerified: new Date(),
        isArtist: true,
        isReviewer: false,
      },
    });

    let artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    });

    if (!artistProfile) {
      artistProfile = await prisma.artistProfile.create({
        data: {
          userId: user.id,
          artistName: entry.artistName,
          completedOnboarding: true,
          reviewCredits: 0,
          totalCreditsSpent: 5,
        },
      });
    }

    // 5. Resolve genre IDs: umbrella + 1 random sub-genre
    const genreSlugs = [folderGenres.umbrella, pickRandom(folderGenres.subGenres)];
    const genreIds = genreSlugs
      .map((slug) => genreMap.get(slug))
      .filter(Boolean) as string[];

    // 6. Create Track
    const track = await prisma.track.create({
      data: {
        artistId: artistProfile.id,
        sourceUrl,
        sourceType: "UPLOAD",
        title: entry.title,
        feedbackFocus: pickRandom(focusTemplates),
        isPublic: true,
        packageType: "PEER",
        reviewsRequested: 5,
        creditsSpent: 5,
        status: "QUEUED",
        paidAt: new Date(),
        Genre: { connect: genreIds.map((id) => ({ id })) },
      },
    });

    await prisma.artistProfile.update({
      where: { id: artistProfile.id },
      data: { totalTracks: { increment: 1 } },
    });

    createdTrackIds.push(track.id);
    console.log(`  ✓ Track ${track.id} created (QUEUED, genres: ${genreSlugs.join(", ")})\n`);
  }

  // 7. Assign reviewers
  console.log(`\nAssigning reviewers to ${createdTrackIds.length} tracks...`);
  for (const trackId of createdTrackIds) {
    try {
      await assignReviewersToTrack(trackId);
      console.log(`  ✓ Assigned reviewers for ${trackId}`);
    } catch (err) {
      console.warn(`  ⚠ Could not assign reviewers for ${trackId}:`, err);
    }
  }

  console.log(`\n✅ Done! Seeded ${createdTrackIds.length} tracks into the review queue.\n`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
