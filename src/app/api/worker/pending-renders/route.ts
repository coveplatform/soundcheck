import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple API key auth for the worker
// In production, use environment variable
const WORKER_API_KEY = process.env.WORKER_API_KEY || "dev-worker-key";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Check API key
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (apiKey !== WORKER_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tracks with PENDING render status
    const pendingTracks = await prisma.track.findMany({
      where: {
        abletonRenderStatus: "PENDING",
      },
      select: {
        id: true,
        title: true,
        abletonProjectUrl: true,
        abletonProjectData: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc", // First come, first served
      },
    });

    return NextResponse.json({ tracks: pendingTracks });
  } catch (error) {
    console.error("Error fetching pending renders:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending renders" },
      { status: 500 }
    );
  }
}
