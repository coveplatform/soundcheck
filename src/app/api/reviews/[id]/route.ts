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

    const reviewerProfile = await prisma.listenerProfile.findUnique({
      where: { userId: session.user.id },
      select: { isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
    });

    // Also check for peer reviewer (ArtistProfile)
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, completedOnboarding: true },
    });
    const isPeerReviewer = !reviewerProfile && !!artistProfile;

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

    if (isPeerReviewer && !artistProfile?.completedOnboarding) {
      return NextResponse.json(
        { error: "Please complete onboarding before reviewing" },
        { status: 403 }
      );
    }

    if (!reviewerProfile && !artistProfile) {
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
        peerReviewerArtist: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    }) as any;

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify ownership - check legacy reviewer OR peer reviewer
    const isLegacyOwner = review.reviewer?.userId === session.user.id;
    const isPeerOwner = (review as any).peerReviewerArtistId === artistProfile?.id;
    if (!isLegacyOwner && !isPeerOwner) {
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
