import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";

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

    await request.json().catch(() => ({}));

    const reviewerProfile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
    });

    if (reviewerProfile?.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (
      reviewerProfile &&
      (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed)
    ) {
      return NextResponse.json(
        { error: "Please complete onboarding before reviewing" },
        { status: 403 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: { select: { id: true, userId: true } },
        track: { select: { id: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.reviewer.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status !== "ASSIGNED" && review.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Only active reviews can be marked unplayable" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.review.update({
        where: { id },
        data: { status: "EXPIRED" },
        select: { id: true },
      }),
      prisma.reviewQueue.deleteMany({
        where: {
          trackId: review.track.id,
          reviewerId: review.reviewer.id,
        },
      }),
    ]);

    await assignReviewersToTrack(review.track.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking review unplayable:", error);
    return NextResponse.json(
      { error: "Failed to mark review unplayable" },
      { status: 500 }
    );
  }
}
