import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformStats } from "@/lib/platform-stats";

/**
 * GET /api/t/[trackShareId]
 * Fetch public track data for sharing page
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ trackShareId: string }> }
) {
  try {
    const { trackShareId } = await context.params;

    // Parse affiliate code from query params
    const url = new URL(request.url);
    const affiliateCode = url.searchParams.get("ref");

    // Fetch track by trackShareId
    const track = await prisma.track.findUnique({
      where: { trackShareId },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        sourceUrl: true,
        sourceType: true,
        sharingEnabled: true,
        sharingMode: true,
        salePrice: true,
        showReviewsOnPublicPage: true,
        publicPlayCount: true,
        duration: true,
        genres: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        artist: {
          select: {
            id: true,
            artistName: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        reviews: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
            shareId: true,
            productionScore: true,
            originalityScore: true,
            vocalScore: true,
            wouldListenAgain: true,
            wouldAddToPlaylist: true,
            wouldShare: true,
            wouldFollow: true,
            bestPart: true,
            weakestPart: true,
            nextActions: true,
            perceivedGenre: true,
            similarArtists: true,
            createdAt: true,
            reviewer: {
              select: {
                tier: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    // Check if sharing is enabled
    if (!track.sharingEnabled) {
      return NextResponse.json(
        { error: "This track is not publicly shared" },
        { status: 403 }
      );
    }

    // Track the click if affiliate code provided
    if (affiliateCode) {
      // Fire and forget - don't await
      prisma.trackAffiliateLink
        .update({
          where: { code: affiliateCode },
          data: {
            clickCount: { increment: 1 },
          },
        })
        .catch((err) => {
          console.error("Failed to track affiliate click:", err);
        });
    }

    // Calculate aggregate review stats
    const reviews = track.showReviewsOnPublicPage ? track.reviews : [];

    const avgScores = reviews.length > 0 ? {
      production: reviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) / reviews.length,
      originality: reviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / reviews.length,
      vocal: reviews.filter(r => r.vocalScore !== null).reduce((sum, r) => sum + (r.vocalScore || 0), 0) /
             (reviews.filter(r => r.vocalScore !== null).length || 1),
    } : null;

    const wouldListenAgainCount = reviews.filter(r => r.wouldListenAgain).length;
    const wouldListenAgainPercent = reviews.length > 0
      ? Math.round((wouldListenAgainCount / reviews.length) * 100)
      : 0;

    // Get platform stats for value props
    const platformStats = await getPlatformStats();

    // Return public track data
    return NextResponse.json({
      track: {
        id: track.id,
        trackShareId,
        title: track.title,
        artworkUrl: track.artworkUrl,
        sourceUrl: track.sourceUrl,
        sourceType: track.sourceType,
        sharingMode: track.sharingMode,
        salePrice: track.salePrice,
        publicPlayCount: track.publicPlayCount,
        duration: track.duration,
        genres: track.genres,
        artist: {
          id: track.artist.id,
          artistName: track.artist.artistName,
        },
        reviewStats: avgScores ? {
          averageScores: avgScores,
          totalReviews: reviews.length,
          wouldListenAgainPercent,
          reviews: track.showReviewsOnPublicPage ? reviews.slice(0, 3) : [], // Show max 3 reviews
        } : null,
      },
      platformStats: {
        activeListeners: platformStats.activeListeners,
        totalReviews: platformStats.totalReviewsCompleted,
        avgResponseTime: platformStats.avgResponseTime,
      },
      affiliateCode,
    });
  } catch (error) {
    console.error("Error fetching public track:", error);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/t/[trackShareId]/play
 * Track play event for analytics
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ trackShareId: string }> }
) {
  try {
    const { trackShareId } = await context.params;
    const body = await request.json();
    const affiliateCode = body.affiliateCode;

    // Increment play count
    await prisma.track.update({
      where: { trackShareId },
      data: {
        publicPlayCount: { increment: 1 },
      },
    });

    // Track affiliate play if code provided
    if (affiliateCode) {
      await prisma.trackAffiliateLink
        .update({
          where: { code: affiliateCode },
          data: {
            playCount: { increment: 1 },
          },
        })
        .catch((err) => {
          console.error("Failed to track affiliate play:", err);
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking play:", error);
    return NextResponse.json(
      { error: "Failed to track play" },
      { status: 500 }
    );
  }
}
