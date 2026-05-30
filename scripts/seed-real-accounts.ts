/**
 * Creates 8 realistic user accounts, uploads their MP3s to S3,
 * creates track records, and queues each for 4 reviews.
 *
 * Usage:
 *   1. Drop 8 .mp3 files into scripts/seed-tracks/
 *      (they're paired to accounts by alphabetical order)
 *   2. npx tsx scripts/seed-real-accounts.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const s3 = new S3Client({
  region: process.env.UPLOADS_S3_REGION!,
  endpoint: process.env.UPLOADS_S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.UPLOADS_S3_ENDPOINT),
  credentials: {
    accessKeyId: process.env.UPLOADS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.UPLOADS_S3_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
});

const BUCKET = process.env.UPLOADS_S3_BUCKET!;
const PUBLIC_BASE = (() => {
  const raw = (process.env.UPLOADS_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return raw.startsWith("http") ? raw : `https://${raw}`;
})();

const ACCOUNTS = [
  { artistName: "djstonez",      email: "djstonez@gmail.com"       },
  { artistName: "beatsbykova",   email: "beatsbykova@gmail.com"    },
  { artistName: "lucidwavs",     email: "lucidwavs@gmail.com"      },
  { artistName: "mrkrxn",        email: "mrkrxn@gmail.com"         },
  { artistName: "prodbyflux",    email: "prodbyflux@gmail.com"     },
  { artistName: "solarframe",    email: "solarframe@gmail.com"     },
  { artistName: "lowkeybeats",   email: "lowkeybeats@gmail.com"    },
  { artistName: "cloudnyne",     email: "cloudnyne@gmail.com"      },
];

const DEFAULT_PASSWORD = "Mixreflect1!";
const REVIEWS_PER_TRACK = 4;
const TRACKS_DIR = path.join(__dirname, "seed-tracks");

async function uploadToS3(filePath: string): Promise<string> {
  const bytes = await fs.readFile(filePath);
  const key = `tracks/${crypto.randomBytes(16).toString("hex")}.mp3`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: bytes,
    ContentType: "audio/mpeg",
  }));

  return `${PUBLIC_BASE}/${key}`;
}

async function main() {
  const files = (await fs.readdir(TRACKS_DIR))
    .filter(f => f.toLowerCase().endsWith(".mp3"))
    .sort();

  if (files.length < ACCOUNTS.length) {
    throw new Error(
      `Need ${ACCOUNTS.length} MP3s in scripts/seed-tracks/, found ${files.length}`
    );
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const account = ACCOUNTS[i];
    const file = files[i];
    const filePath = path.join(TRACKS_DIR, file);
    const trackTitle = path.basename(file, ".mp3").replace(/[-_]/g, " ").trim();

    console.log(`\n[${i + 1}/${ACCOUNTS.length}] ${account.artistName} — "${trackTitle}"`);

    // Create user
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password: hashedPassword,
        emailVerified: new Date(),
        isArtist: true,
        isReviewer: true,
      },
    });

    // Create profile
    const profile = await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        artistName: account.artistName,
        completedOnboarding: true,
        reviewCredits: 0,
        reviewerExpertise: "INTERMEDIATE",
        experienceLevel: "INTERMEDIATE",
      },
    });

    // Upload file to S3
    console.log(`  Uploading ${file}...`);
    const sourceUrl = await uploadToS3(filePath);
    console.log(`  → ${sourceUrl}`);

    // Create track
    const track = await prisma.track.create({
      data: {
        artistId: profile.id,
        sourceUrl,
        sourceType: "UPLOAD",
        title: trackTitle,
        status: "IN_PROGRESS",
        packageType: "PEER",
        reviewsRequested: REVIEWS_PER_TRACK,
        reviewsCompleted: 0,
        creditsSpent: REVIEWS_PER_TRACK,
        isPublic: false,
      },
    });

    console.log(`  Track created: ${track.id}`);
    console.log(`  Status: IN_PROGRESS, ${REVIEWS_PER_TRACK} reviews requested`);
  }

  console.log("\nDone. All 8 accounts + tracks created.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
