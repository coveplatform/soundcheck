import { NextResponse } from "next/server";
import { cleanupAbandonedTracks, cleanupExpiredCheckouts } from "@/lib/cleanup";

/**
 * Cron endpoint for cleaning up abandoned tracks.
 *
 * This should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
 * to periodically clean up tracks that were created but never paid for.
 *
 * Protected by CRON_SECRET environment variable.
 *
 * Usage:
 * POST /api/cron/cleanup
 * Headers: { "Authorization": "Bearer YOUR_CRON_SECRET" }
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!process.env.CRON_SECRET) {
      console.error("[Cleanup] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (token !== process.env.CRON_SECRET) {
      console.error("[Cleanup] Invalid cron secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cleanup] Starting cleanup job...");

    // Run both cleanup tasks
    const [abandonedResult, expiredResult] = await Promise.all([
      cleanupAbandonedTracks(),
      cleanupExpiredCheckouts(),
    ]);

    const totalDeleted = abandonedResult.deleted + expiredResult.deleted;

    console.log(
      `[Cleanup] Job complete. Deleted ${totalDeleted} tracks total (${abandonedResult.deleted} abandoned, ${expiredResult.deleted} expired)`
    );

    return NextResponse.json({
      success: true,
      abandoned: {
        deleted: abandonedResult.deleted,
        tracks: abandonedResult.tracks,
      },
      expired: {
        deleted: expiredResult.deleted,
        tracks: expiredResult.tracks,
      },
      total: totalDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cleanup] Error running cleanup job:", error);
    return NextResponse.json(
      {
        error: "Failed to run cleanup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Allow GET requests for testing (still requires auth)
 */
export async function GET(request: Request) {
  return POST(request);
}
