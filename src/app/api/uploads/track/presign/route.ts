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

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
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
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to upload tracks" },
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

    if (!isMp3) {
      return NextResponse.json(
        { error: "Only MP3 uploads are supported" },
        { status: 400 }
      );
    }

    const normalizedContentType =
      typeLower === "audio/mp3" ? "audio/mpeg" : data.contentType;

    const key = `tracks/${randomBytes(16).toString("hex")}.mp3`;

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

    console.error("Presign upload error:", error);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 500 }
    );
  }
}
