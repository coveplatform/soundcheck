import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReviewerTier } from "@/lib/queue";

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

    const review = (await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        isGem: true,
        reviewerId: true,
        track: {
          select: {
            artist: { select: { userId: true } },
          },
        },
      } as any,
    })) as any;

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed reviews can be marked as a gem" },
        { status: 400 }
      );
    }

    if (review.isGem) {
      return NextResponse.json({ success: true, review: { id: review.id, isGem: true } });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id: review.id },
        data: { isGem: true } as any,
        select: { id: true, isGem: true, reviewerId: true } as any,
      });

      await tx.reviewerProfile.update({
        where: { id: updatedReview.reviewerId },
        data: { gemCount: { increment: 1 } } as any,
        select: { id: true } as any,
      });

      return updatedReview;
    });

    await updateReviewerTier(result.reviewerId);

    return NextResponse.json({ success: true, review: { id: result.id, isGem: result.isGem } });
  } catch (error) {
    console.error("Error marking review as gem:", error);
    return NextResponse.json(
      { error: "Failed to mark review as gem" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const review = (await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        isGem: true,
        reviewerId: true,
        track: {
          select: {
            artist: { select: { userId: true } },
          },
        },
      } as any,
    })) as any;

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed reviews can be updated" },
        { status: 400 }
      );
    }

    if (!review.isGem) {
      return NextResponse.json({ success: true, review: { id: review.id, isGem: false } });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id: review.id },
        data: { isGem: false } as any,
        select: { id: true, isGem: true, reviewerId: true } as any,
      });

      await tx.reviewerProfile.update({
        where: { id: updatedReview.reviewerId },
        data: { gemCount: { decrement: 1 } } as any,
        select: { id: true } as any,
      });

      return updatedReview;
    });

    await updateReviewerTier(result.reviewerId);

    return NextResponse.json({ success: true, review: { id: result.id, isGem: result.isGem } });
  } catch (error) {
    console.error("Error unmarking review as gem:", error);
    return NextResponse.json(
      { error: "Failed to update gem status" },
      { status: 500 }
    );
  }
}
