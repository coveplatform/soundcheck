import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

    const include = {
      ArtistProfile: {
        select: {
          artistName: true,
          User: { select: { image: true } },
        },
      },
    };

    const formatPick = (s: any) => ({
      id: s.id,
      title: s.title,
      artistName: s.ArtistProfile?.artistName ?? "Unknown Artist",
      artistImage: s.ArtistProfile?.User?.image ?? null,
      artworkUrl: s.artworkUrl,
      sourceUrl: s.sourceUrl,
      sourceType: s.sourceType,
      genre: s.genre,
      editorNote: s.editorNote,
      editorNoteByline: s.editorNoteByline,
      chartDate: s.chartDate instanceof Date
        ? s.chartDate.toISOString().split("T")[0]
        : s.chartDate,
    });

    // chart-finalize stores the pick under yesterday's date (it runs at 00:01 UTC
    // and picks the best track from the previous day's reviews)
    const [todayPick, recentPicks] = await Promise.all([
      (prisma as any).chartSubmission.findFirst({
        where: { chartDate: yesterday, isFeatured: true },
        include,
      }),
      (prisma as any).chartSubmission.findMany({
        where: {
          chartDate: { gte: fourteenDaysAgo, lt: yesterday },
          isFeatured: true,
        },
        orderBy: { chartDate: "desc" },
        take: 10,
        include,
      }),
    ]);

    return NextResponse.json({
      today: todayPick ? formatPick(todayPick) : null,
      recent: recentPicks.map(formatPick),
      featuredWinner: todayPick ? formatPick(todayPick) : (recentPicks[0] ? formatPick(recentPicks[0]) : null),
    });
  } catch (err) {
    console.error("Charts fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
