import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PACKAGES, PackageType } from "@/lib/metadata";
import { assignReviewersToTrack } from "@/lib/queue";

const requestSchema = z.object({
  desiredReviews: z.number().int().min(1).max(10),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const data = requestSchema.parse(body);

    const track = (await (prisma.track as any).findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            userId: true,
            subscriptionStatus: true,
            reviewCredits: true,
          }
        },
        reviews: { select: { id: true } },
      },
    })) as any;

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((track.status as any) === "CANCELLED") {
      return NextResponse.json(
        { error: "Cancelled tracks cannot be updated" },
        { status: 400 }
      );
    }

    if (track.reviews.length > 0) {
      return NextResponse.json(
        { error: "This track already has reviews" },
        { status: 400 }
      );
    }

    const isEligibleUploadOnly = (track.status as any) === "UPLOADED";

    if (!isEligibleUploadOnly) {
      return NextResponse.json(
        { error: "Track is not eligible for requesting reviews" },
        { status: 400 }
      );
    }

    const desired = data.desiredReviews;
    const cost = desired;

    if ((track.artist.reviewCredits ?? 0) < cost) {
      return NextResponse.json(
        { error: "Not enough credits. Earn more by reviewing tracks or buy a top-up." },
        { status: 403 }
      );
    }

    const packageType: PackageType = "PEER";

    await prisma.$transaction(async (tx) => {
      const updatedCredits = await (tx.artistProfile as any).updateMany({
        where: {
          id: track.artistId,
          reviewCredits: {
            gte: cost,
          },
        },
        data: {
          reviewCredits: {
            decrement: cost,
          },
          totalCreditsSpent: {
            increment: cost,
          },
        },
      });

      if (updatedCredits.count === 0) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      const updatedTrack = await tx.track.updateMany({
        where: {
          id: track.id,
          status: "UPLOADED",
        },
        data: {
          packageType,
          reviewsRequested: desired,
          reviewsCompleted: 0,
          status: "QUEUED",
          paidAt: new Date(),
          completedAt: null,
        },
      });

      if (updatedTrack.count === 0) {
        throw new Error("TRACK_NOT_ELIGIBLE");
      }
    });

    await assignReviewersToTrack(track.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "TRACK_NOT_ELIGIBLE") {
      return NextResponse.json(
        { error: "Track is not eligible for requesting reviews" },
        { status: 400 }
      );
    }

    console.error("Request reviews error:", error);
    return NextResponse.json(
      { error: "Failed to request reviews" },
      { status: 500 }
    );
  }
}
