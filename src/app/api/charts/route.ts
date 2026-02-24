import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charts?date=YYYY-MM-DD&period=daily|weekly|all-time
 * Returns the chart leaderboard for a given date.
 * Defaults to today's chart.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateStr = searchParams.get("date");
  const period = searchParams.get("period") || "daily";

  let chartDate: Date;
  if (dateStr) {
    chartDate = new Date(dateStr + "T00:00:00Z");
    if (isNaN(chartDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
  } else {
    chartDate = new Date();
    chartDate.setUTCHours(0, 0, 0, 0);
  }

  try {
    if (period === "daily") {
      const submissions = await (prisma as any).chartSubmission.findMany({
        where: { chartDate },
        orderBy: [{ voteCount: "desc" }, { playCount: "desc" }, { createdAt: "asc" }],
        include: {
          ArtistProfile: {
            select: {
              artistName: true,
              subscriptionStatus: true,
              User: { select: { image: true } },
            },
          },
          ChartVote: {
            where: { voterId: session.user.id },
            select: { id: true },
          },
          Track: {
            select: {
              Genre: { select: { name: true, slug: true } },
            },
          },
        },
      });

      // Sort with Pro tiebreaker: equal votes → Pro ranks higher
      const sorted = [...submissions].sort((a: any, b: any) => {
        if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
        const aIsPro = a.ArtistProfile.subscriptionStatus === "active" ? 1 : 0;
        const bIsPro = b.ArtistProfile.subscriptionStatus === "active" ? 1 : 0;
        if (bIsPro !== aIsPro) return bIsPro - aIsPro;
        if (b.playCount !== a.playCount) return b.playCount - a.playCount;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const leaderboard = sorted.map((s: any, i: number) => ({
        id: s.id,
        rank: i + 1,
        trackId: s.trackId,
        title: s.title,
        artworkUrl: s.artworkUrl,
        sourceUrl: s.sourceUrl,
        sourceType: s.sourceType,
        genre: s.genre,
        genres: s.Track?.Genre?.map((g: any) => g.name) || [],
        voteCount: s.voteCount,
        playCount: s.playCount,
        artistName: s.ArtistProfile.artistName,
        artistImage: s.ArtistProfile.User?.image,
        isPro: s.ArtistProfile.subscriptionStatus === "active",
        hasVoted: s.ChartVote.length > 0,
        isOwn: s.artistId === session.user.artistProfileId,
        isFeatured: s.isFeatured,
        createdAt: s.createdAt,
      }));

      // Get yesterday's featured winner
      const yesterday = new Date(chartDate);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const featuredWinner = await (prisma as any).chartSubmission.findFirst({
        where: { chartDate: yesterday, isFeatured: true },
        include: {
          ArtistProfile: {
            select: { artistName: true, User: { select: { image: true } } },
          },
        },
      });

      return NextResponse.json({
        date: chartDate.toISOString().split("T")[0],
        period,
        leaderboard,
        featuredWinner: featuredWinner
          ? {
              id: featuredWinner.id,
              title: featuredWinner.title,
              artworkUrl: featuredWinner.artworkUrl,
              sourceUrl: featuredWinner.sourceUrl,
              sourceType: featuredWinner.sourceType,
              voteCount: featuredWinner.voteCount,
              artistName: featuredWinner.ArtistProfile.artistName,
              artistImage: featuredWinner.ArtistProfile.User?.image,
            }
          : null,
        totalSubmissions: submissions.length,
      });
    }

    // Weekly: aggregate last 7 days
    if (period === "weekly") {
      const weekAgo = new Date(chartDate);
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

      const submissions = await (prisma as any).chartSubmission.findMany({
        where: {
          chartDate: { gte: weekAgo, lte: chartDate },
        },
        include: {
          ArtistProfile: {
            select: {
              artistName: true,
              subscriptionStatus: true,
              User: { select: { image: true } },
            },
          },
          ChartVote: {
            where: { voterId: session.user.id },
            select: { id: true },
          },
        },
      });

      // Aggregate by trackId — same track submitted on multiple days gets combined
      const trackMap = new Map<string, any>();
      for (const s of submissions) {
        const existing = trackMap.get(s.trackId);
        if (existing) {
          existing.voteCount += s.voteCount;
          existing.playCount += s.playCount;
          if (s.ChartVote.length > 0) existing.hasVoted = true;
        } else {
          trackMap.set(s.trackId, {
            id: s.id,
            trackId: s.trackId,
            title: s.title,
            artworkUrl: s.artworkUrl,
            sourceUrl: s.sourceUrl,
            sourceType: s.sourceType,
            genre: s.genre,
            voteCount: s.voteCount,
            playCount: s.playCount,
            artistName: s.ArtistProfile.artistName,
            artistImage: s.ArtistProfile.User?.image,
            isPro: s.ArtistProfile.subscriptionStatus === "active",
            hasVoted: s.ChartVote.length > 0,
            isOwn: s.artistId === session.user.artistProfileId,
            isFeatured: false,
            createdAt: s.createdAt,
          });
        }
      }

      const leaderboard = Array.from(trackMap.values())
        .sort((a, b) => b.voteCount - a.voteCount || b.playCount - a.playCount)
        .map((item, i) => ({ ...item, rank: i + 1 }));

      return NextResponse.json({
        date: chartDate.toISOString().split("T")[0],
        period,
        leaderboard,
        featuredWinner: null,
        totalSubmissions: leaderboard.length,
      });
    }

    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  } catch (err: any) {
    console.error("Chart fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch chart" }, { status: 500 });
  }
}
