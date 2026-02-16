import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/tracks/[id]/delete
 * Deletes a track and all associated data after updating reviewer stats
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: trackId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify track ownership
      const track = await tx.track.findUnique({
        where: { id: trackId },
        select: {
          id: true,
          title: true,
          artistId: true,
          status: true,
          ArtistProfile: {
            select: { userId: true },
          },
          Review: {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              paidAmount: true,
              peerReviewerArtistId: true,
              reviewerId: true,
              isPeerReview: true,
            },
          },
        },
      });

      if (!track) {
        throw new Error("Track not found");
      }

      if (track.ArtistProfile.userId !== session.user.id) {
        throw new Error("Not authorized to delete this track");
      }

      // Prevent deletion of QUEUED or IN_PROGRESS tracks (use cancel instead)
      if (track.status === "QUEUED" || track.status === "IN_PROGRESS") {
        throw new Error(
          "Cannot delete tracks that are queued or in progress. Use cancel instead."
        );
      }

      const completedReviews = track.Review;
      const reviewCount = completedReviews.length;

      // Update reviewer stats before deletion
      for (const review of completedReviews) {
        if (review.isPeerReview && review.peerReviewerArtistId) {
          // Peer reviewer - update ArtistProfile
          await tx.artistProfile.update({
            where: { id: review.peerReviewerArtistId },
            data: {
              totalPeerReviews: { decrement: 1 },
              totalEarnings: { decrement: review.paidAmount },
              // Note: We don't touch pendingBalance as payment already happened
            },
          });
        } else if (review.reviewerId) {
          // Legacy reviewer - update ReviewerProfile
          await tx.reviewerProfile.update({
            where: { id: review.reviewerId },
            data: {
              totalReviews: { decrement: 1 },
              totalEarnings: { decrement: review.paidAmount },
            },
          });
        }
      }

      // Delete the track (cascade will handle Review, Payment, Purchase, etc.)
      await tx.track.delete({
        where: { id: trackId },
      });

      return {
        success: true,
        trackTitle: track.title,
        reviewersAffected: reviewCount,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error deleting track:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete track" },
      { status: 400 }
    );
  }
}
