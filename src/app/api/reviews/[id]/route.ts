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

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        Track: {
          include: {
            Genre: true,
            ArtistProfile: {
              select: {
                artistName: true,
              },
            },
          },
        },
        ReviewerProfile: {
          select: {
            id: true,
            tier: true,
            userId: true,
            isRestricted: true,
          },
        },
        ArtistProfile: {
          select: {
            id: true,
            userId: true,
            totalPeerReviews: true,
            peerReviewRating: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Ownership check: peer review uses ArtistProfile, legacy uses ReviewerProfile
    const isPeer = review.isPeerReview || !!review.peerReviewerArtistId;
    const isOwner = isPeer
      ? review.ArtistProfile?.userId === session.user.id
      : review.ReviewerProfile?.userId === session.user.id;

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.ReviewerProfile?.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    // Per-user listen timer bypass
    const SKIP_LISTEN_TIMER_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
    const skipListenTimer = SKIP_LISTEN_TIMER_EMAILS.includes(
      (session.user.email ?? "").toLowerCase()
    );

    return NextResponse.json({ ...review, skipListenTimer });
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
        Track: {
          include: {
            ArtistProfile: true,
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

    if (review.Track.ArtistProfile.userId !== session.user.id) {
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
