import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import path from "path";
import { promises as fs } from "fs";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 25MB)" },
        { status: 400 }
      );
    }

    const nameLower = file.name.toLowerCase();
    const typeLower = (file.type || "").toLowerCase();

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

    const bytes = Buffer.from(await file.arrayBuffer());

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${randomBytes(16).toString("hex")}.mp3`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, bytes);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      filename,
      originalName: file.name,
    });
  } catch (error) {
    console.error("Upload track error:", error);
    return NextResponse.json(
      { error: "Failed to upload track" },
      { status: 500 }
    );
  }
}
