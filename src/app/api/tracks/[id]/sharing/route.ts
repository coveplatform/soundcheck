import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { nanoid } from "nanoid";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sharingConfigSchema = z.object({
  sharingEnabled: z.boolean(),
  sharingMode: z.enum(["EXPOSURE", "SALES"]).optional(),
  salePrice: z.number().int().min(100).max(10000).optional(), // $1 - $100 in cents
  showReviewsOnPublicPage: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await context.params;
    const body = await request.json();
    const config = sharingConfigSchema.parse(body);

    // Fetch track and verify ownership
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: {
          select: {
            userId: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to configure this track" },
        { status: 403 }
      );
    }

    // Validate track eligibility
    if (track.sourceType !== "UPLOAD") {
      return NextResponse.json(
        {
          error:
            "Only uploaded tracks (MP3/WAV) can be shared. Linked tracks from SoundCloud, YouTube, or Bandcamp cannot be sold.",
        },
        { status: 400 }
      );
    }

    // Validate SALES mode requirements
    if (config.sharingMode === "SALES") {
      // Check Pro subscription
      const isPro = track.artist.subscriptionStatus === "active";

      if (!isPro) {
        return NextResponse.json(
          {
            error:
              "Sales mode requires a Pro subscription. Upgrade to enable paid downloads.",
            requiresUpgrade: true,
          },
          { status: 403 }
        );
      }

      // Require sale price for SALES mode
      if (!config.salePrice) {
        return NextResponse.json(
          { error: "Sale price is required for SALES mode" },
          { status: 400 }
        );
      }
    }

    // Generate trackShareId if enabling sharing and doesn't have one
    let trackShareId = track.trackShareId;
    if (config.sharingEnabled && !trackShareId) {
      trackShareId = nanoid(10); // e.g., "Vf3k2Hd8Qs"
    }

    // Update track configuration
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: {
        sharingEnabled: config.sharingEnabled,
        sharingMode: config.sharingMode ?? (config.sharingEnabled ? "EXPOSURE" : null),
        salePrice: config.salePrice,
        showReviewsOnPublicPage: config.showReviewsOnPublicPage ?? track.showReviewsOnPublicPage,
        trackShareId,
      },
      select: {
        id: true,
        trackShareId: true,
        sharingEnabled: true,
        sharingMode: true,
        salePrice: true,
        showReviewsOnPublicPage: true,
      },
    });

    return NextResponse.json({
      success: true,
      track: updatedTrack,
      publicUrl: trackShareId ? `${process.env.NEXT_PUBLIC_APP_URL}/t/${trackShareId}` : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error configuring track sharing:", error);
    return NextResponse.json(
      { error: "Failed to configure sharing" },
      { status: 500 }
    );
  }
}

// GET - Fetch current sharing configuration
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await context.params;

    // Fetch track and verify ownership
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: {
          select: {
            userId: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this track" },
        { status: 403 }
      );
    }

    const isPro = track.artist.subscriptionStatus === "active";
    const isEligibleForSharing = track.sourceType === "UPLOAD";
    const isEligibleForSales = isEligibleForSharing && isPro;

    return NextResponse.json({
      trackShareId: track.trackShareId,
      sharingEnabled: track.sharingEnabled,
      sharingMode: track.sharingMode,
      salePrice: track.salePrice,
      showReviewsOnPublicPage: track.showReviewsOnPublicPage,
      publicUrl: track.trackShareId
        ? `${process.env.NEXT_PUBLIC_APP_URL}/t/${track.trackShareId}`
        : null,
      eligibility: {
        canShare: isEligibleForSharing,
        canSell: isEligibleForSales,
        reason: !isEligibleForSharing
          ? "Only uploaded tracks (MP3/WAV) can be shared"
          : !isPro
          ? "Upgrade to Pro to enable sales mode"
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching track sharing config:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}
