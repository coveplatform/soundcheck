import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEditorNoteForSubmission } from "@/lib/track-of-the-day/generate-editor-note";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

/**
 * POST /api/cron/chart-finalize
 * Runs at 00:01 UTC daily.
 * Picks the best-reviewed track from yesterday's completed reviews
 * and marks it as Track of the Day. No voting — the review pipeline decides.
 */
async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setUTCHours(23, 59, 59, 999);

    // Look back up to 7 days so low-activity days still produce a winner
    const sevenDaysAgo = new Date(yesterday);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    // Find tracks already featured in the past 7 days so we don't repeat them
    const recentlyFeatured = await (prisma as any).chartSubmission.findMany({
      where: { isFeatured: true, chartDate: { gte: sevenDaysAgo } },
      select: { trackId: true },
    });
    const recentlyFeaturedTrackIds = new Set(recentlyFeatured.map((s: any) => s.trackId));

    // Find all reviews completed in the past 7 days
    let reviews = await (prisma as any).review.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: yesterday, lte: yesterdayEnd },
        countsTowardAnalytics: true,
      },
      include: {
        Track: {
          include: {
            ArtistProfile: { select: { id: true, artistName: true } },
            Genre: { select: { name: true } },
          },
        },
      },
    });

    // If nothing from yesterday, widen to 7 days
    if (reviews.length === 0) {
      reviews = await (prisma as any).review.findMany({
        where: {
          status: "COMPLETED",
          updatedAt: { gte: sevenDaysAgo, lte: yesterdayEnd },
          countsTowardAnalytics: true,
        },
        include: {
          Track: {
            include: {
              ArtistProfile: { select: { id: true, artistName: true } },
              Genre: { select: { name: true } },
            },
          },
        },
      });
    }

    if (reviews.length === 0) {
      return NextResponse.json({ success: true, message: "No reviewed tracks in the past 7 days", winner: null });
    }

    // Group by track, score by reviewCount + avg scores
    const trackMap = new Map<string, any>();
    for (const review of reviews) {
      if (!review.Track || !review.Track.ArtistProfile) continue;
      const existing = trackMap.get(review.trackId) ?? {
        track: review.Track,
        reviewCount: 0,
        totalProduction: 0,
        totalOriginality: 0,
        reviews: [],
      };
      existing.reviewCount += 1;
      existing.totalProduction += review.productionScore ?? 3;
      existing.totalOriginality += review.originalityScore ?? 3;
      existing.reviews.push(review);
      trackMap.set(review.trackId, existing);
    }

    // Sort: most reviews first, then avg score as tiebreaker
    const ranked = Array.from(trackMap.values()).sort((a, b) => {
      const scoreA = a.reviewCount * 3 + (a.totalProduction / a.reviewCount) + (a.totalOriginality / a.reviewCount);
      const scoreB = b.reviewCount * 3 + (b.totalProduction / b.reviewCount) + (b.totalOriginality / b.reviewCount);
      return scoreB - scoreA;
    });

    // Prefer a track not featured in the past 7 days; fall back to top overall if all have been featured
    const winner = ranked.find((r) => !recentlyFeaturedTrackIds.has(r.track.id)) ?? ranked[0];
    const track = winner.track;

    // Create or update the ChartSubmission for yesterday
    let submission: any;
    const existing = await (prisma as any).chartSubmission.findFirst({
      where: { trackId: track.id, chartDate: yesterday },
    });

    if (existing) {
      submission = await (prisma as any).chartSubmission.update({
        where: { id: existing.id },
        data: { isFeatured: true, rank: 1, voteCount: winner.reviewCount },
      });
    } else {
      submission = await (prisma as any).chartSubmission.create({
        data: {
          trackId: track.id,
          artistId: track.ArtistProfile.id,
          chartDate: yesterday,
          title: track.title,
          artworkUrl: track.artworkUrl ?? null,
          sourceUrl: track.sourceUrl,
          sourceType: track.sourceType,
          genre: track.Genre?.[0]?.name ?? null,
          isFeatured: true,
          rank: 1,
          voteCount: winner.reviewCount,
        },
      });
    }

    // Generate AI editor's note
    let editorNoteStatus: "generated" | "failed" = "generated";
    try {
      const note = await generateEditorNoteForSubmission(submission.id);
      await (prisma as any).chartSubmission.update({
        where: { id: submission.id },
        data: {
          editorNote: note,
          editorNoteByline: "MixReflect",
          editorNoteGeneratedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[chart-finalize] Editor note failed:", err);
      editorNoteStatus = "failed";
    }

    return NextResponse.json({
      success: true,
      winner: { id: submission.id, title: track.title, reviewCount: winner.reviewCount },
      editorNote: editorNoteStatus,
    });
  } catch (error) {
    console.error("Chart finalize error:", error);
    return NextResponse.json({ error: "Failed to finalize chart" }, { status: 500 });
  }
}

export async function GET(request: Request) { return handler(request); }
export async function POST(request: Request) { return handler(request); }
