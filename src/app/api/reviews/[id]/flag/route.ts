import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        },
        select: {
          id: true,
          wasFlagged: true,
          flagReason: true,
          reviewerId: true,
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

      return { updatedReview, reviewer: reviewerAfter };
    });

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
