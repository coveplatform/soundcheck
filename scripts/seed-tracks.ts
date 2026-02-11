/**
 * Seed script: populate the review queue with real tracks.
 *
 * Usage:
 *   1. Drop MP3 files into ./seed-tracks/ folder
 *   2. Set env vars (or they'll be read from .env):
 *        DATABASE_URL, UPLOADS_S3_BUCKET, UPLOADS_S3_REGION,
 *        UPLOADS_S3_ACCESS_KEY_ID, UPLOADS_S3_SECRET_ACCESS_KEY,
 *        UPLOADS_PUBLIC_BASE_URL
 *   3. Run:  npx tsx scripts/seed-tracks.ts
 *
 * What it does:
 *   - Creates a fake User + ArtistProfile for each persona
 *   - Uploads each MP3 to S3
 *   - Creates a Track record (status QUEUED, public, with genres)
 *   - Calls assignReviewersToTrack so real reviewers see them
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { assignReviewersToTrack } from "../src/lib/queue";

// ---------------------------------------------------------------------------
// Personas — each gets one track. Add more as needed.
// ---------------------------------------------------------------------------
const PERSONAS = [
  { name: "Luna Voss", email: "luna.voss@seed.mixreflect.com", genres: ["electronic", "synthwave"], title: "Neon Drift", focus: "How's the synth layering? Trying to nail that retro-future vibe." },
  { name: "Jamal Carter", email: "jamal.carter@seed.mixreflect.com", genres: ["hip-hop", "trap"], title: "Late Night Grind", focus: "Focus on the vocal mix — does the 808 hit hard enough?" },
  { name: "Rosie Chen", email: "rosie.chen@seed.mixreflect.com", genres: ["indie-pop", "bedroom-pop"], title: "Paper Planes", focus: "Is the chorus catchy? Wondering if the bridge feels too long." },
  { name: "Kai Bergström", email: "kai.bergstrom@seed.mixreflect.com", genres: ["techno", "minimal"], title: "Carbon Loop", focus: "Does the build work? Trying a more stripped-back arrangement." },
  { name: "Aria Malone", email: "aria.malone@seed.mixreflect.com", genres: ["rnb", "neo-soul"], title: "Golden Hour", focus: "Vocal clarity — does it sit well in the mix?" },
  { name: "Tomás Reyes", email: "tomas.reyes@seed.mixreflect.com", genres: ["rock", "indie-rock"], title: "Rust & Bone", focus: "Guitar tone and overall energy. Too compressed?" },
  { name: "Yuki Tanaka", email: "yuki.tanaka@seed.mixreflect.com", genres: ["lo-fi", "lo-fi-hip-hop"], title: "Rainfall Tape", focus: "Vibe check — does it feel chill enough for studying?" },
  { name: "Elara Storm", email: "elara.storm@seed.mixreflect.com", genres: ["edm", "future-bass"], title: "Supernova", focus: "Drop impact — does it hit? Any frequency clashes?" },
  { name: "Marcus Webb", email: "marcus.webb@seed.mixreflect.com", genres: ["boom-bap", "conscious-hip-hop"], title: "Old Souls", focus: "Sample chops and overall groove. How's the kick pattern?" },
  { name: "Freya Lindqvist", email: "freya.lindqvist@seed.mixreflect.com", genres: ["house", "deep-house"], title: "Velvet Floor", focus: "Bassline groove and mix balance. Club-ready?" },
  { name: "Devon Park", email: "devon.park@seed.mixreflect.com", genres: ["drill", "uk-rap"], title: "Cold Outside", focus: "Does the slide bass cut through? Flow feedback appreciated." },
  { name: "Sage Holloway", email: "sage.holloway@seed.mixreflect.com", genres: ["singer-songwriter", "folk"], title: "Autumn Letters", focus: "Vocal emotion and acoustic guitar tone." },
  { name: "Niko Petrov", email: "niko.petrov@seed.mixreflect.com", genres: ["drum-and-bass", "jungle"], title: "Fracture Point", focus: "Break patterns and sub bass. Too busy or just right?" },
  { name: "Isla Fernandez", email: "isla.fernandez@seed.mixreflect.com", genres: ["pop", "electropop"], title: "Glitter & Gold", focus: "Production polish — is it radio-ready? Hook strength?" },
  { name: "Axel Drummond", email: "axel.drummond@seed.mixreflect.com", genres: ["metal", "metalcore"], title: "Iron Veil", focus: "Guitar tone and drum punch. Does the breakdown land?" },
  { name: "Mina Okafor", email: "mina.okafor@seed.mixreflect.com", genres: ["soul", "jazz"], title: "Candlelight", focus: "Piano and vocal interplay. Too much reverb?" },
  { name: "Zephyr Blake", email: "zephyr.blake@seed.mixreflect.com", genres: ["experimental", "electronica"], title: "Static Garden", focus: "Texture and sound design — is it cohesive or chaotic?" },
  { name: "Lena Fischer", email: "lena.fischer@seed.mixreflect.com", genres: ["trance", "progressive-house"], title: "Aurora", focus: "Build-up tension and release. Melody memorable?" },
  { name: "Omar Hassan", email: "omar.hassan@seed.mixreflect.com", genres: ["phonk", "trap"], title: "Midnight Drift", focus: "Cowbell pattern and distortion levels. Too aggressive?" },
  { name: "Violet Marsh", email: "violet.marsh@seed.mixreflect.com", genres: ["dream-pop", "synth-pop"], title: "Underwater Stars", focus: "Atmosphere and reverb tails. Does it feel dreamy enough?" },
];

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
// Main
// ---------------------------------------------------------------------------
async function main() {
  const bucket = process.env.UPLOADS_S3_BUCKET;
  const publicBaseUrl = process.env.UPLOADS_PUBLIC_BASE_URL;

  if (!bucket || !publicBaseUrl) {
    throw new Error("Missing env: UPLOADS_S3_BUCKET, UPLOADS_PUBLIC_BASE_URL");
  }

  // 1. Read MP3 files
  const seedDir = join(__dirname, "..", "seed-tracks");
  let mp3Files: string[];
  try {
    mp3Files = readdirSync(seedDir)
      .filter((f) => f.toLowerCase().endsWith(".mp3"))
      .sort()
      .map((f) => join(seedDir, f));
  } catch {
    console.error(`\n❌ No seed-tracks/ folder found. Create it and add MP3 files.\n`);
    process.exit(1);
  }

  if (mp3Files.length === 0) {
    console.error(`\n❌ No MP3 files found in seed-tracks/\n`);
    process.exit(1);
  }

  console.log(`Found ${mp3Files.length} MP3 files`);
  console.log(`Using ${Math.min(mp3Files.length, PERSONAS.length)} personas\n`);

  // 2. Load genre map
  const allGenres = await prisma.genre.findMany({ select: { id: true, slug: true } });
  const genreMap = new Map(allGenres.map((g) => [g.slug, g.id]));

  const s3 = getS3Client();
  const count = Math.min(mp3Files.length, PERSONAS.length);
  const createdTrackIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const persona = PERSONAS[i];
    const mp3Path = mp3Files[i];

    console.log(`[${i + 1}/${count}] ${persona.name} — "${persona.title}"`);

    // 3. Upload MP3 to S3
    console.log(`  Uploading ${mp3Path.split(/[\\/]/).pop()}...`);
    const sourceUrl = await uploadToS3(s3, bucket, mp3Path);
    console.log(`  → ${sourceUrl}`);

    // 4. Create User + ArtistProfile
    const user = await prisma.user.upsert({
      where: { email: persona.email },
      update: {},
      create: {
        email: persona.email,
        name: persona.name,
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
          artistName: persona.name,
          completedOnboarding: true,
          reviewCredits: 0,
          totalCreditsSpent: 5,
        },
      });
    }

    // 5. Resolve genre IDs
    const genreIds = persona.genres
      .map((slug) => genreMap.get(slug))
      .filter(Boolean) as string[];

    // 6. Create Track
    const track = await prisma.track.create({
      data: {
        artistId: artistProfile.id,
        sourceUrl,
        sourceType: "UPLOAD",
        title: persona.title,
        feedbackFocus: persona.focus,
        isPublic: true,
        packageType: "PEER",
        reviewsRequested: 5,
        creditsSpent: 5,
        status: "QUEUED",
        paidAt: new Date(),
        Genre: { connect: genreIds.map((id) => ({ id })) },
      },
    });

    // Increment totalTracks
    await prisma.artistProfile.update({
      where: { id: artistProfile.id },
      data: { totalTracks: { increment: 1 } },
    });

    createdTrackIds.push(track.id);
    console.log(`  ✓ Track ${track.id} created (QUEUED, 5 reviews requested)\n`);
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
