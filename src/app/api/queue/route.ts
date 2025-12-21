import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireAndReassignExpiredQueueEntries } from "@/lib/queue";

export async function GET() {
  try {
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

    const reviewerProfile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!reviewerProfile) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    if (reviewerProfile.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
      return NextResponse.json(
        { error: "Please complete onboarding before reviewing" },
        { status: 403 }
      );
    }

    await expireAndReassignExpiredQueueEntries();

    // Get pending reviews (assigned but not completed)
    const pendingReviews = await prisma.review.findMany({
      where: {
        reviewerId: reviewerProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
      include: {
        track: {
          include: {
            genres: true,
            artist: {
              select: {
                artistName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(pendingReviews);
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
