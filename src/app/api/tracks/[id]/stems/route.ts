import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stemSchema = z.object({
  stemUrl: z.string().url(),
  stemType: z.enum(["MASTER", "DRUMS", "BASS", "SYNTHS", "VOCALS", "MELODY", "FX", "OTHER"]),
  label: z.string().min(1).max(100),
  order: z.number().int().min(0),
  duration: z.number().int().positive().optional(),
});

const createStemsSchema = z.object({
  stems: z.array(stemSchema).min(1).max(10),
});

// GET /api/tracks/[id]/stems - Get all stems for a track
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const track = await prisma.track.findUnique({
      where: { id },
      select: {
        hasStems: true,
        Stem: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasStems: track.hasStems,
      stems: track.stems,
    });
  } catch (error) {
    console.error("Get stems error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stems" },
      { status: 500 }
    );
  }
}

// POST /api/tracks/[id]/stems - Create stem records
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { artistProfile: { select: { id: true } } },
    });

    if (!user?.artistProfile) {
      return NextResponse.json(
        { error: "Artist profile required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = createStemsSchema.parse(body);

    // Verify track ownership
    const track = await prisma.track.findUnique({
      where: { id },
      select: {
        artistId: true,
        status: true,
        _count: { select: { stems: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artistId !== user.artistProfile.id) {
      return NextResponse.json(
        { error: "You don't own this track" },
        { status: 403 }
      );
    }

    if (track.status !== "UPLOADED") {
      return NextResponse.json(
        { error: "Can only add stems to tracks in UPLOADED status" },
        { status: 400 }
      );
    }

    // Validate stem URLs match S3 pattern
    const publicBaseUrl = process.env.UPLOADS_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
    if (publicBaseUrl) {
      for (const stem of data.stems) {
        const isS3Url = stem.stemUrl.startsWith(publicBaseUrl) || stem.stemUrl.startsWith("http");
        if (!isS3Url && !stem.stemUrl.startsWith("/uploads/")) {
          return NextResponse.json(
            { error: `Invalid stem URL: ${stem.stemUrl}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate duration matching (all stems within ±2 seconds)
    const durations = data.stems.filter(s => s.duration).map(s => s.duration!);
    if (durations.length > 1) {
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      if (maxDuration - minDuration > 2) {
        return NextResponse.json(
          {
            error: "Stem durations must match within 2 seconds",
            details: { minDuration, maxDuration, difference: maxDuration - minDuration },
          },
          { status: 400 }
        );
      }
    }

    // Check if adding these stems would exceed the limit
    if (track._count.stems + data.stems.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 stems per track" },
        { status: 400 }
      );
    }

    // Create stems and update track
    const result = await prisma.$transaction(async (tx) => {
      // Create all stems
      const createdStems = await Promise.all(
        data.stems.map((stem) =>
          tx.trackStem.create({
            data: {
              trackId: id,
              stemUrl: stem.stemUrl,
              stemType: stem.stemType,
              label: stem.label,
              order: stem.order,
              duration: stem.duration,
            },
          })
        )
      );

      // Update track hasStems flag
      const updatedTrack = await tx.track.update({
        where: { id },
        data: { hasStems: true },
        include: {
          Stem: {
            orderBy: { order: "asc" },
          },
        },
      });

      return updatedTrack;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Create stems error:", error);
    return NextResponse.json(
      { error: "Failed to create stems" },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[id]/stems - Delete all stems for a track
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { artistProfile: { select: { id: true } } },
    });

    if (!user?.artistProfile) {
      return NextResponse.json(
        { error: "Artist profile required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify track ownership
    const track = await prisma.track.findUnique({
      where: { id },
      select: { artistId: true },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artistId !== user.artistProfile.id) {
      return NextResponse.json(
        { error: "You don't own this track" },
        { status: 403 }
      );
    }

    // Delete all stems and update track
    await prisma.$transaction(async (tx) => {
      await tx.trackStem.deleteMany({
        where: { trackId: id },
      });

      await tx.track.update({
        where: { id },
        data: { hasStems: false },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete stems error:", error);
    return NextResponse.json(
      { error: "Failed to delete stems" },
      { status: 500 }
    );
  }
}
