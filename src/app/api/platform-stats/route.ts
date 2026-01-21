import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/platform-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getPlatformStats();

    return NextResponse.json({
      activeListeners: stats.activeListeners,
      totalReviews: stats.totalReviewsCompleted,
      avgResponseTime: stats.avgResponseTime,
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform stats" },
      { status: 500 }
    );
  }
}
