import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PACKAGES, PackageType } from "@/lib/metadata";

const requestSchema = z.object({
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE"]),
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

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            userId: true,
            subscriptionStatus: true,
          }
        },
        reviews: { select: { id: true } },
      },
    });

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

    // Determine package type based on subscription status
    const isSubscribed = track.artist.subscriptionStatus === "active";
    const packageType: PackageType = isSubscribed ? (data.packageType as PackageType) : "STARTER";
    const packageDetails = PACKAGES[packageType];

    // Directly queue the track for reviews (no payment required)
    await prisma.track.update({
      where: { id: track.id },
      data: {
        packageType,
        reviewsRequested: packageDetails.reviews,
        reviewsCompleted: 0,
        status: "QUEUED",
        paidAt: new Date(), // Mark as "paid" (free)
        completedAt: null,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
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
