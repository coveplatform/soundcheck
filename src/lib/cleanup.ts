import { prisma } from "@/lib/prisma";

/**
 * Clean up abandoned tracks that were created but never paid for.
 *
 * Criteria for deletion:
 * - Status: UPLOADED (never progressed to QUEUED)
 * - Reviews requested: 0 (never paid for any reviews)
 * - Created more than 24 hours ago
 * - No reviews exist for this track
 */
export async function cleanupAbandonedTracks() {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  try {
    // Find abandoned tracks
    const abandonedTracks = await prisma.track.findMany({
      where: {
        status: "UPLOADED",
        reviewsRequested: 0,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: {
            Review: true,
          },
        },
      },
    });

    // Filter to only tracks with no reviews (extra safety check)
    const tracksToDelete = abandonedTracks.filter(
      (track) => track._count.Review === 0
    );

    if (tracksToDelete.length === 0) {
      console.log("[Cleanup] No abandoned tracks to clean up");
      return {
        deleted: 0,
        tracks: [],
      };
    }

    // Delete the tracks
    const trackIds = tracksToDelete.map((t) => t.id);

    const result = await prisma.track.deleteMany({
      where: {
        id: {
          in: trackIds,
        },
      },
    });

    console.log(
      `[Cleanup] Deleted ${result.count} abandoned tracks:`,
      tracksToDelete.map((t) => ({
        id: t.id,
        title: t.title,
        age: Math.round(
          (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60)
        ) + "h",
      }))
    );

    return {
      deleted: result.count,
      tracks: tracksToDelete.map((t) => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt,
      })),
    };
  } catch (error) {
    console.error("[Cleanup] Error cleaning up abandoned tracks:", error);
    throw error;
  }
}

/**
 * Clean up expired checkout sessions (tracks that were created for checkout but payment never completed)
 * This is a more aggressive cleanup that runs after 7 days instead of 24 hours.
 */
export async function cleanupExpiredCheckouts() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // Find tracks that are stuck in UPLOADED state for over 7 days
    const expiredTracks = await prisma.track.findMany({
      where: {
        status: "UPLOADED",
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        title: true,
        reviewsRequested: true,
        createdAt: true,
      },
    });

    if (expiredTracks.length === 0) {
      console.log("[Cleanup] No expired checkout tracks to clean up");
      return {
        deleted: 0,
        tracks: [],
      };
    }

    const trackIds = expiredTracks.map((t) => t.id);

    const result = await prisma.track.deleteMany({
      where: {
        id: {
          in: trackIds,
        },
      },
    });

    console.log(
      `[Cleanup] Deleted ${result.count} expired checkout tracks:`,
      expiredTracks.map((t) => ({
        id: t.id,
        title: t.title,
        reviewsRequested: t.reviewsRequested,
        age: Math.round(
          (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ) + "d",
      }))
    );

    return {
      deleted: result.count,
      tracks: expiredTracks,
    };
  } catch (error) {
    console.error("[Cleanup] Error cleaning up expired checkouts:", error);
    throw error;
  }
}
