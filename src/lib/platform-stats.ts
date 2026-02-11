// Platform statistics for value props
import { prisma } from "@/lib/prisma";

export interface PlatformStats {
  activeListeners: number; // Listeners who reviewed in last 30 days
  totalReviewsCompleted: number;
  totalTracksReviewed: number;
  avgResponseTime: string; // e.g., "< 24 hours"
  topGenres: string[]; // Top 5 genres on the platform
}

/**
 * Get platform-wide statistics for value prop displays
 * Results are cached in memory for 15 minutes
 */
let statsCache: { data: PlatformStats; timestamp: number } | null = null;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function getPlatformStats(): Promise<PlatformStats> {
  // Return cached data if available and fresh
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION_MS) {
    return statsCache.data;
  }

  // Calculate active listeners (reviewed in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeListenerCount = await prisma.reviewerProfile.count({
    where: {
      lastReviewDate: {
        gte: thirtyDaysAgo,
      },
      isRestricted: false,
    },
  });

  // Total completed reviews
  const totalReviewsCompleted = await prisma.review.count({
    where: {
      status: "COMPLETED",
    },
  });

  // Total unique tracks reviewed
  const totalTracksReviewed = await prisma.track.count({
    where: {
      status: "COMPLETED",
    },
  });

  // Get top genres by track count
  const genreStats = await prisma.genre.findMany({
    include: {
      _count: {
        select: {
          Track: true,
        },
      },
    },
    orderBy: {
      Track: {
        _count: "desc",
      },
    },
    take: 5,
  });

  const topGenres = genreStats.map((g) => g.name);

  // Calculate average response time (simplified - could be made more accurate)
  // For now, we'll use a fixed value based on typical completion time
  const avgResponseTime = "< 24 hours";

  const stats: PlatformStats = {
    activeListeners: activeListenerCount,
    totalReviewsCompleted,
    totalTracksReviewed,
    avgResponseTime,
    topGenres,
  };

  // Cache the results
  statsCache = {
    data: stats,
    timestamp: Date.now(),
  };

  return stats;
}

/**
 * Get formatted stats for display in UI
 */
export function formatPlatformStats(stats: PlatformStats): {
  activeListeners: string;
  totalReviews: string;
  avgResponseTime: string;
} {
  return {
    activeListeners: `${stats.activeListeners.toLocaleString()}+`,
    totalReviews: `${stats.totalReviewsCompleted.toLocaleString()}+`,
    avgResponseTime: stats.avgResponseTime,
  };
}
