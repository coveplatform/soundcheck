import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PURCHASE_AMOUNT_CENTS = 50; // $0.50

const purchaseSchema = z.object({
  trackId: z.string().min(1),
});

export async function POST(request: Request) {
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
        { error: "Please verify your email to purchase tracks" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { trackId } = purchaseSchema.parse(body);

    // Get reviewer profile
    const reviewer = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        pendingBalance: true,
      },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    // Check sufficient balance
    if (reviewer.pendingBalance < PURCHASE_AMOUNT_CENTS) {
      return NextResponse.json(
        { error: "Insufficient balance. You need at least $0.50 to purchase a track." },
        { status: 400 }
      );
    }

    // Get track and validate it's purchasable
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        allowPurchase: true,
        artistId: true,
        artist: {
          select: {
            id: true,
            artistName: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    // Validate track is an upload (not a link)
    if (track.sourceType !== "UPLOAD") {
      return NextResponse.json(
        { error: "Only uploaded tracks can be purchased" },
        { status: 400 }
      );
    }

    // Validate artist enabled purchases
    if (!track.allowPurchase) {
      return NextResponse.json(
        { error: "This track is not available for purchase" },
        { status: 400 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        trackId_reviewerId: {
          trackId: track.id,
          reviewerId: reviewer.id,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You have already purchased this track" },
        { status: 400 }
      );
    }

    // Process purchase in transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Deduct from reviewer balance
      const updated = await tx.reviewerProfile.updateMany({
        where: {
          id: reviewer.id,
          pendingBalance: { gte: PURCHASE_AMOUNT_CENTS },
        },
        data: { pendingBalance: { decrement: PURCHASE_AMOUNT_CENTS } },
      });

      if (updated.count === 0) {
        throw new Error("Insufficient balance");
      }

      // Add to artist balance
      await tx.artistProfile.update({
        where: { id: track.artistId },
        data: {
          pendingBalance: { increment: PURCHASE_AMOUNT_CENTS },
          totalEarnings: { increment: PURCHASE_AMOUNT_CENTS },
        },
      });

      // Create purchase record
      return tx.purchase.create({
        data: {
          trackId: track.id,
          reviewerId: reviewer.id,
          amount: PURCHASE_AMOUNT_CENTS,
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      purchase,
      downloadUrl: `/api/tracks/${track.id}/download`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Insufficient balance") {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  }
}

// GET - list reviewer's purchases
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewer = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    const purchases = await prisma.purchase.findMany({
      where: { reviewerId: reviewer.id },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        track: {
          select: {
            id: true,
            title: true,
            sourceUrl: true,
            artist: {
              select: {
                artistName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}
