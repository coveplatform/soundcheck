import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charts/activity
 * Returns the current user's chart activity.
 * Uses slot model (Option A): Free = 1 slot, Pro = 3 slots.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, subscriptionStatus: true },
    });

    if (!artistProfile) {
      return NextResponse.json({ activity: null });
    }

    const isPro = artistProfile.subscriptionStatus === "active";
    const maxSlots = isPro ? 3 : 1;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Today's submissions (array)
    const todaySubmissions = await (prisma as any).chartSubmission.findMany({
      where: { artistId: artistProfile.id, chartDate: today },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        voteCount: true,
        playCount: true,
        rank: true,
        chartDate: true,
      },
      orderBy: { voteCount: "desc" },
    });

    const slotsUsed = todaySubmissions.length;
    const canSubmit = slotsUsed < maxSlots;

    // Past results (last 10, excluding today)
    const pastSubmissions = await (prisma as any).chartSubmission.findMany({
      where: {
        artistId: artistProfile.id,
        chartDate: { lt: today },
      },
      orderBy: { chartDate: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        voteCount: true,
        playCount: true,
        rank: true,
        isFeatured: true,
        chartDate: true,
      },
    });

    // Aggregate stats
    const allSubmissions = await (prisma as any).chartSubmission.findMany({
      where: { artistId: artistProfile.id },
      select: { voteCount: true, rank: true, isFeatured: true },
    });

    const totalSubmissions = allSubmissions.length;
    const totalVotesReceived = allSubmissions.reduce(
      (sum: number, s: any) => sum + s.voteCount,
      0
    );
    const wins = allSubmissions.filter((s: any) => s.isFeatured).length;
    const rankedSubmissions = allSubmissions.filter((s: any) => s.rank != null);
    const bestRank =
      rankedSubmissions.length > 0
        ? Math.min(...rankedSubmissions.map((s: any) => s.rank))
        : null;

    return NextResponse.json({
      activity: {
        isPro,
        maxSlots,
        slotsUsed,
        canSubmit,
        todaySubmissions: todaySubmissions.map((s: any) => ({
          id: s.id,
          title: s.title,
          artworkUrl: s.artworkUrl,
          voteCount: s.voteCount,
          playCount: s.playCount,
          rank: s.rank,
          date: s.chartDate,
        })),
        // Keep singular for backwards compat with dashboard
        todaySubmission: todaySubmissions[0]
          ? {
              id: todaySubmissions[0].id,
              title: todaySubmissions[0].title,
              artworkUrl: todaySubmissions[0].artworkUrl,
              voteCount: todaySubmissions[0].voteCount,
              playCount: todaySubmissions[0].playCount,
              rank: todaySubmissions[0].rank,
              date: todaySubmissions[0].chartDate,
            }
          : null,
        pastSubmissions: pastSubmissions.map((s: any) => ({
          id: s.id,
          title: s.title,
          artworkUrl: s.artworkUrl,
          voteCount: s.voteCount,
          playCount: s.playCount,
          rank: s.rank,
          isFeatured: s.isFeatured,
          date: s.chartDate,
        })),
        stats: {
          totalSubmissions,
          totalVotesReceived,
          wins,
          bestRank,
        },
      },
    });
  } catch (err: any) {
    console.error("Chart activity error:", err);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
