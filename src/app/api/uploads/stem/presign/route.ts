import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_STEMS_PER_TRACK = 10;

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
  trackId: z.string().min(1),
  stemType: z.enum(["MASTER", "DRUMS", "BASS", "SYNTHS", "VOCALS", "MELODY", "FX", "OTHER"]),
  label: z.string().min(1).max(100),
});

function getS3Client(): { client: S3Client | null; missingEnv: string[] } {
  const endpoint = process.env.UPLOADS_S3_ENDPOINT;
  const region = process.env.UPLOADS_S3_REGION;
  const accessKeyId = process.env.UPLOADS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.UPLOADS_S3_SECRET_ACCESS_KEY;

  const missingEnv: string[] = [];
  if (!region) missingEnv.push("UPLOADS_S3_REGION");
  if (!accessKeyId) missingEnv.push("UPLOADS_S3_ACCESS_KEY_ID");
  if (!secretAccessKey) missingEnv.push("UPLOADS_S3_SECRET_ACCESS_KEY");

  if (missingEnv.length > 0) {
    return { client: null, missingEnv };
  }

  return {
    client: new S3Client({
      region: region!,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    }),
    missingEnv: [],
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ArtistProfile: { select: { id: true } } },
    });

    if (!user?.ArtistProfile) {
      return NextResponse.json(
        { error: "Artist profile required" },
        { status: 403 }
      );
    }

    const bucket = process.env.UPLOADS_S3_BUCKET;
    const publicBaseUrl = process.env.UPLOADS_PUBLIC_BASE_URL;

    const { client, missingEnv } = getS3Client();
    const missing = [...missingEnv];
    if (!bucket) missing.push("UPLOADS_S3_BUCKET");
    if (!publicBaseUrl) missing.push("UPLOADS_PUBLIC_BASE_URL");

    if (!client || !bucket || !publicBaseUrl) {
      console.warn("Cloud uploads not configured", { missing });
      return NextResponse.json(
        {
          error: "Cloud uploads not configured",
          missing,
        },
        { status: 501 }
      );
    }

    const body = await request.json();
    const data = presignSchema.parse(body);

    // Verify track ownership
    const track = await prisma.track.findUnique({
      where: { id: data.trackId },
      select: {
        artistId: true,
        status: true,
        _count: { select: { TrackStem: true } },
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    if (track.artistId !== user.ArtistProfile.id) {
      return NextResponse.json(
        { error: "You don't own this track" },
        { status: 403 }
      );
    }

    if (track.status !== "UPLOADED") {
      return NextResponse.json(
        { error: "Can only upload stems to tracks in UPLOADED status" },
        { status: 400 }
      );
    }

    // Check stem count limit
    if (track._count.TrackStem >= MAX_STEMS_PER_TRACK) {
      return NextResponse.json(
        { error: `Maximum ${MAX_STEMS_PER_TRACK} stems per track` },
        { status: 400 }
      );
    }

    if (data.contentLength > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 25MB)" },
        { status: 400 }
      );
    }

    const nameLower = data.filename.toLowerCase();
    const typeLower = data.contentType.toLowerCase();

    const isMp3 =
      nameLower.endsWith(".mp3") ||
      typeLower === "audio/mpeg" ||
      typeLower === "audio/mp3";

    const isWav =
      nameLower.endsWith(".wav") ||
      typeLower === "audio/wav" ||
      typeLower === "audio/x-wav";

    if (!isMp3 && !isWav) {
      return NextResponse.json(
        { error: "Only MP3 and WAV files are supported" },
        { status: 400 }
      );
    }

    // Normalize content type
    let normalizedContentType = data.contentType;
    if (typeLower === "audio/mp3") normalizedContentType = "audio/mpeg";
    if (typeLower === "audio/x-wav") normalizedContentType = "audio/wav";

    // Generate unique key for stem
    const extension = isMp3 ? "mp3" : "wav";
    const key = `stems/${data.trackId}/${randomBytes(16).toString("hex")}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: normalizedContentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });

    const baseRaw = publicBaseUrl.trim().replace(/\/+$/, "");
    const base =
      baseRaw.startsWith("https://") || baseRaw.startsWith("http://")
        ? baseRaw
        : `https://${baseRaw}`;
    const fileUrl = `${base}/${key}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
      contentType: normalizedContentType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Presign stem upload error:", error);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 500 }
    );
  }
}
