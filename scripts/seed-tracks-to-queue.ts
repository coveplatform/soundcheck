/**
 * seed-tracks-to-queue.ts
 *
 * Uploads MP3s from seed-tracks/(genre)/ to S3 and creates QUEUED Track
 * records attributed to the matching seed artist accounts.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-tracks-to-queue.ts
 *
 * Safe to re-run — skips tracks that already exist for each artist.
 */

import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { assignReviewersToTrack } from "../src/lib/queue";

// ── Config ──────────────────────────────────────────────────────────────────

const SEED_TRACKS_DIR = path.join(process.cwd(), "seed-tracks");
const REVIEWS_REQUESTED = 3;

// Genre folder → genre ID mapping (from DB)
const GENRE_MAP: Record<string, string> = {
  electronic: "cmjjgfm8o00001wviosjyxti0", // Electronic
  hiphop:     "cmjjgfsmy000i1wvialvm04nq", // Hip-Hop
  rock:       "cmjjgfueo000n1wvied14t5se", // Rock
};

// ── S3 setup ─────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.UPLOADS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.UPLOADS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.UPLOADS_S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.UPLOADS_S3_BUCKET!;
const BASE_URL = (() => {
  const raw = (process.env.UPLOADS_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return raw.startsWith("http") ? raw : `https://${raw}`;
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "Remy Solis - Afterglow.mp3" → { artist: "Remy Solis", title: "Afterglow" } */
function parseFilename(file: string): { artist: string; title: string } | null {
  const name = file.replace(/\.mp3$/i, "");
  const idx = name.indexOf(" - ");
  if (idx === -1) return null;
  return { artist: name.slice(0, idx).trim(), title: name.slice(idx + 3).trim() };
}

/** "Remy Solis" → "remy.solis" */
function artistNameToEmailPrefix(artist: string): string {
  return artist.toLowerCase().replace(/\s+/g, ".");
}

async function uploadToS3(filePath: string): Promise<string> {
  const key = `tracks/${randomBytes(16).toString("hex")}.mp3`;
  const body = fs.readFileSync(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "audio/mpeg",
    })
  );
  return `${BASE_URL}/${key}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Load all seed artist profiles keyed by email prefix
  const seedArtists = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, User: { select: { email: true } } },
  });

  const artistByPrefix = new Map<string, string>(); // emailPrefix → artistProfileId
  for (const a of seedArtists) {
    const prefix = a.User.email.split("@")[0]; // e.g. "remy.solis"
    artistByPrefix.set(prefix, a.id);
  }

  console.log(`Found ${seedArtists.length} seed artists\n`);

  const genres = fs.readdirSync(SEED_TRACKS_DIR).filter((g) =>
    fs.statSync(path.join(SEED_TRACKS_DIR, g)).isDirectory()
  );

  for (const genre of genres) {
    const genreId = GENRE_MAP[genre.toLowerCase()];
    if (!genreId) {
      console.log(`⚠ No genre ID mapped for folder "${genre}" — skipping`);
      continue;
    }

    const files = fs
      .readdirSync(path.join(SEED_TRACKS_DIR, genre))
      .filter((f) => f.toLowerCase().endsWith(".mp3"));

    console.log(`\n── ${genre.toUpperCase()} (${files.length} tracks) ──`);

    for (const file of files) {
      const parsed = parseFilename(file);
      if (!parsed) {
        console.log(`  ✗ Could not parse filename: ${file}`);
        continue;
      }

      const emailPrefix = artistNameToEmailPrefix(parsed.artist);
      const artistProfileId = artistByPrefix.get(emailPrefix);

      if (!artistProfileId) {
        console.log(`  ✗ No seed account for "${parsed.artist}" (${emailPrefix}@seed.mixreflect.com)`);
        continue;
      }

      // Check if this artist already has a track with this title
      const existing = await prisma.track.findFirst({
        where: { artistId: artistProfileId, title: parsed.title },
      });

      if (existing) {
        console.log(`  – Already exists: "${parsed.title}" — skipping`);
        continue;
      }

      // Upload to S3
      process.stdout.write(`  ↑ Uploading "${parsed.title}"...`);
      const filePath = path.join(SEED_TRACKS_DIR, genre, file);
      let sourceUrl: string;
      try {
        sourceUrl = await uploadToS3(filePath);
        process.stdout.write(" uploaded\n");
      } catch (err) {
        console.log(` FAILED: ${err}`);
        continue;
      }

      // Create Track record (artwork assigned after creation so we can use the ID as picsum seed)
      const track = await prisma.track.create({
        data: {
          artistId: artistProfileId,
          sourceUrl,
          sourceType: "UPLOAD",
          title: parsed.title,
          packageType: "PEER",
          reviewsRequested: REVIEWS_REQUESTED,
          reviewsCompleted: 0,
          creditsSpent: REVIEWS_REQUESTED,
          status: "QUEUED",
          paidAt: new Date(),
          artworkUrl: `https://picsum.photos/seed/${parsed.title.toLowerCase().replace(/\s+/g, "-")}/400/400`,
          Genre: { connect: [{ id: genreId }] },
        },
      });

      // Trigger reviewer assignment
      try {
        await assignReviewersToTrack(track.id);
      } catch {
        // Non-fatal — track is in queue, reviewers will be assigned by cron
      }

      console.log(`  ✓ Created: "${parsed.title}" → ${track.id}`);
    }
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
