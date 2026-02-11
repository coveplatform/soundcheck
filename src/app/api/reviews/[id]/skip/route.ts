import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";

const SKIP_LIMIT_PER_DAY = 3;

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

    if (reviewerProfile && (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed)) {
      return NextResponse.json(
        { error: "Please complete onboarding before reviewing" },
        { status: 403 }
      );
    }

    await request.json().catch(() => ({}));

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        ReviewerProfile: { select: { userId: true, id: true } },
        Track: { select: { id: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.ReviewerProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status !== "ASSIGNED" && review.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Only active reviews can be skipped" },
        { status: 400 }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const skipsToday = await prisma.review.count({
      where: {
        reviewerId: review.ReviewerProfile.id,
        status: "SKIPPED",
        updatedAt: { gte: startOfDay },
      },
    });

    if (skipsToday >= SKIP_LIMIT_PER_DAY) {
      return NextResponse.json(
        { error: `Skip limit reached (${SKIP_LIMIT_PER_DAY}/day)` },
        { status: 400 }
      );
    }

    await prisma.review.update({
      where: { id },
      data: { status: "SKIPPED" },
      select: { id: true },
    });

    await prisma.reviewQueue.deleteMany({
      where: {
        trackId: review.Track.id,
        reviewerId: review.ReviewerProfile.id,
      },
    });

    await assignReviewersToTrack(review.Track.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error skipping review:", error);
    return NextResponse.json({ error: "Failed to skip review" }, { status: 500 });
  }
}
