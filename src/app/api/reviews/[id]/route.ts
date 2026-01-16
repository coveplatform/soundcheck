import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateReviewerAverageRating, updateReviewerTier } from "@/lib/queue";

export async function GET(
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

    const review = await prisma.review.findUnique({
      where: { id },
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
        reviewer: {
          select: {
            id: true,
            tier: true,
            userId: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify ownership
    if (review.reviewer.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

const rateReviewSchema = z.object({
  artistRating: z.number().int().min(1).max(5),
});

export async function PATCH(
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
    const { artistRating } = rateReviewSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        track: {
          include: {
            artist: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed reviews can be rated" },
        { status: 400 }
      );
    }

    if (review.track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { artistRating },
      select: {
        id: true,
        artistRating: true,
        reviewerId: true,
      },
    });

    await updateReviewerAverageRating(updated.reviewerId);
    await updateReviewerTier(updated.reviewerId);

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error rating review:", error);
    return NextResponse.json(
      { error: "Failed to rate review" },
      { status: 500 }
    );
  }
}
