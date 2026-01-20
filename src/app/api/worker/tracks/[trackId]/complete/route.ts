import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const WORKER_API_KEY = process.env.WORKER_API_KEY || "dev-worker-key";

export const runtime = "nodejs";

const completeStemSchema = z.object({
  stemUrl: z.string().min(1),
  stemType: z.enum([
    "DRUMS",
    "BASS",
    "VOCALS",
    "MELODY",
    "HARMONY",
    "EFFECTS",
    "OTHER",
    "MASTER",
  ]),
  label: z.string().optional(),
  order: z.number().int().min(0),
  duration: z.number().int().positive().optional(),
});

const completeRenderSchema = z.object({
  masterUrl: z.string().optional(), // Optional: update track sourceUrl to rendered master
  stems: z.array(completeStemSchema).min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    // Check API key
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (apiKey !== WORKER_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await params;
    const body = await request.json();
    const data = completeRenderSchema.parse(body);

    // Verify track exists and is in PENDING or RENDERING state
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        abletonRenderStatus: true,
        sourceUrl: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (
      track.abletonRenderStatus !== "PENDING" &&
      track.abletonRenderStatus !== "RENDERING"
    ) {
      return NextResponse.json(
        {
          error: `Track render status is ${track.abletonRenderStatus}, expected PENDING or RENDERING`,
        },
        { status: 400 }
      );
    }

    // Create stems
    await prisma.trackStem.createMany({
      data: data.stems.map((stem) => ({
        trackId: track.id,
        stemUrl: stem.stemUrl,
        stemType: stem.stemType,
        label: stem.label || stem.stemType,
        order: stem.order,
        duration: stem.duration,
      })),
    });

    // Update track
    const updateData: any = {
      abletonRenderStatus: "COMPLETED",
      hasStems: true,
    };

    // If masterUrl provided and track sourceUrl was a ZIP, update sourceUrl
    if (data.masterUrl && track.sourceUrl.toLowerCase().endsWith(".zip")) {
      updateData.sourceUrl = data.masterUrl;
    }

    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: updateData,
      include: {
        stems: true,
      },
    });

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error completing render:", error);
    return NextResponse.json(
      { error: "Failed to complete render" },
      { status: 500 }
    );
  }
}
