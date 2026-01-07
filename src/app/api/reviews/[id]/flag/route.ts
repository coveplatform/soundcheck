import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";

const flagSchema = z.object({
  reason: z.enum(["low_effort", "spam", "offensive", "irrelevant"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to continue" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = flagSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        track: { include: { artist: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed reviews can be flagged" },
        { status: 400 }
      );
    }

    if (review.wasFlagged) {
      return NextResponse.json({ error: "Review already flagged" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id },
        data: {
          wasFlagged: true,
          flagReason: reason,
          countsTowardCompletion: false,
          countsTowardAnalytics: false,
        },
        select: {
          id: true,
          wasFlagged: true,
          flagReason: true,
          reviewerId: true,
          trackId: true,
        },
      });

      const reviewer = await tx.reviewerProfile.update({
        where: { id: updatedReview.reviewerId },
        data: {
          flagCount: { increment: 1 },
        },
        select: {
          id: true,
          flagCount: true,
          isRestricted: true,
        },
      });

      const shouldRestrict = reviewer.flagCount > 3;
      const reviewerAfter = shouldRestrict
        ? await tx.reviewerProfile.update({
            where: { id: reviewer.id },
            data: { isRestricted: true },
            select: { id: true, flagCount: true, isRestricted: true },
          })
        : reviewer;

      let affectedTrackIds: string[] = [];

      if (shouldRestrict) {
        const activeReviews = await tx.review.findMany({
          where: {
            reviewerId: reviewerAfter.id,
            status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          },
          select: { trackId: true },
        });

        affectedTrackIds = Array.from(new Set(activeReviews.map((r) => r.trackId)));

        await tx.reviewQueue.deleteMany({
          where: { reviewerId: reviewerAfter.id },
        });

        await tx.review.updateMany({
          where: {
            reviewerId: reviewerAfter.id,
            status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          },
          data: { status: "EXPIRED" },
        });
      }

      // Recalculate track status based on counted completed reviews.
      // IN_PROGRESS means at least 1 counted review submitted.
      const track = await tx.track.findUnique({
        where: { id: updatedReview.trackId },
        select: {
          id: true,
          status: true,
          reviewsRequested: true,
        },
      });

      if (track && track.status !== "CANCELLED") {
        const countedCompletedReviews = await tx.review.count({
          where: {
            trackId: track.id,
            status: "COMPLETED",
            countsTowardCompletion: true,
          },
        });

        const nextStatus =
          countedCompletedReviews >= track.reviewsRequested
            ? ("COMPLETED" as const)
            : countedCompletedReviews > 0
              ? ("IN_PROGRESS" as const)
              : ("QUEUED" as const);

        await tx.track.update({
          where: { id: track.id },
          data: {
            status: nextStatus,
            ...(nextStatus === "COMPLETED"
              ? { completedAt: new Date() }
              : { completedAt: null }),
          },
          select: { id: true },
        });
      }

      // Ensure the flagged review's track gets a replacement review assigned.
      affectedTrackIds = Array.from(new Set([...affectedTrackIds, updatedReview.trackId]));

      return { updatedReview, reviewer: reviewerAfter, affectedTrackIds };
    });

    if (result.affectedTrackIds.length > 0) {
      for (const trackId of result.affectedTrackIds) {
        await assignReviewersToTrack(trackId);
      }
    }

    return NextResponse.json({
      success: true,
      review: {
        id: result.updatedReview.id,
        wasFlagged: result.updatedReview.wasFlagged,
        flagReason: result.updatedReview.flagReason,
      },
      reviewer: result.reviewer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error flagging review:", error);
    return NextResponse.json({ error: "Failed to flag review" }, { status: 500 });
  }
}
