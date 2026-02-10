import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    const body = await request.json();
    const { currentReviewerId, newReviewerId } = body;

    if (!currentReviewerId || !newReviewerId) {
      return NextResponse.json(
        { error: "currentReviewerId and newReviewerId are required" },
        { status: 400 }
      );
    }

    if (currentReviewerId === newReviewerId) {
      return NextResponse.json(
        { error: "Cannot reassign to the same reviewer" },
        { status: 400 }
      );
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        queueEntries: true,
        Review: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.status !== "QUEUED" && track.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Track must be QUEUED or IN_PROGRESS to reassign reviewers" },
        { status: 400 }
      );
    }

    // Verify current reviewer is actually assigned
    const currentQueueEntry = track.queueEntries.find(
      (q) => q.reviewerId === currentReviewerId
    );
    const currentReview = track.Review.find(
      (r) =>
        r.reviewerId === currentReviewerId &&
        (r.status === "ASSIGNED" || r.status === "IN_PROGRESS")
    );

    if (!currentQueueEntry && !currentReview) {
      return NextResponse.json(
        { error: "Current reviewer is not assigned to this track" },
        { status: 400 }
      );
    }

    // Verify new reviewer exists and isn't already assigned
    const newReviewer = await prisma.reviewerProfile.findUnique({
      where: { id: newReviewerId },
      include: { User: { select: { email: true } } },
    });

    if (!newReviewer) {
      return NextResponse.json(
        { error: "New reviewer not found" },
        { status: 404 }
      );
    }

    const existingAssignment = track.Review.find(
      (r) => r.reviewerId === newReviewerId
    );
    const existingQueueEntry = track.queueEntries.find(
      (q) => q.reviewerId === newReviewerId
    );

    if (existingAssignment || existingQueueEntry) {
      return NextResponse.json(
        { error: "New reviewer is already assigned to this track" },
        { status: 400 }
      );
    }

    // Perform reassignment in a transaction
    await prisma.$transaction(async (tx) => {
      // Expire the current reviewer's review if it exists
      if (currentReview) {
        await tx.review.update({
          where: { id: currentReview.id },
          data: { status: "EXPIRED" },
        });
      }

      // Delete the current reviewer's queue entry if it exists
      if (currentQueueEntry) {
        await tx.reviewQueue.delete({
          where: { id: currentQueueEntry.id },
        });
      }

      // Calculate expiration (48 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // Calculate priority based on package type
      const priority =
        track.packageType === "PRO" || track.packageType === "DEEP_DIVE"
          ? 10
          : track.packageType === "STANDARD"
            ? 5
            : 0;

      // Create queue entry for the new reviewer
      await tx.reviewQueue.create({
        data: {
          trackId,
          reviewerId: newReviewerId,
          expiresAt,
          priority,
        },
      });

      // Create review record for the new reviewer
      await tx.review.create({
        data: {
          trackId,
          reviewerId: newReviewerId,
          status: "ASSIGNED",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Reassigned from current reviewer to ${newReviewer.User.email}`,
    });
  } catch (error) {
    console.error("Reassign reviewer error:", error);
    return NextResponse.json(
      { error: "Failed to reassign reviewer" },
      { status: 500 }
    );
  }
}
