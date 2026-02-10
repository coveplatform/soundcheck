import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMISSION_AMOUNT_CENTS } from "@/lib/referral";

const PURCHASE_AMOUNT_CENTS = 50; // $0.50

const purchaseSchema = z.object({
  trackId: z.string().min(1),
  referral: z
    .object({
      reviewerId: z.string().min(1),
      shareId: z.string().min(1),
    })
    .optional(),
});

async function validateReferral(
  referral: { reviewerId: string; shareId: string },
  buyerId: string,
  trackId: string
): Promise<boolean> {
  // Self-referral check: buyer cannot be the referrer
  if (referral.reviewerId === buyerId) {
    return false;
  }

  // Verify the review exists, is completed, and matches the track
  const review = await prisma.review.findUnique({
    where: { shareId: referral.shareId },
    select: { reviewerId: true, trackId: true, status: true },
  });

  if (!review) return false;
  if (review.status !== "COMPLETED") return false;
  if (review.reviewerId !== referral.reviewerId) return false;
  if (review.trackId !== trackId) return false;

  return true;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, referral } = purchaseSchema.parse(body);

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
    if (ReviewerProfile.pendingBalance < PURCHASE_AMOUNT_CENTS) {
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
        ArtistProfile: {
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
          reviewerId: ReviewerProfile.id,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You have already purchased this track" },
        { status: 400 }
      );
    }

    // Validate referral if provided
    let validatedReferral: { reviewerId: string; shareId: string } | null = null;
    if (referral) {
      const isValid = await validateReferral(referral, ReviewerProfile.id, trackId);
      if (isValid) {
        validatedReferral = referral;
      }
    }

    // Process purchase in transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Deduct from reviewer balance
      const updated = await tx.reviewerProfile.updateMany({
        where: {
          id: ReviewerProfile.id,
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

      // Credit affiliate commission if valid referral
      if (validatedReferral) {
        await tx.reviewerProfile.update({
          where: { id: validatedReferral.reviewerId },
          data: {
            pendingBalance: { increment: COMMISSION_AMOUNT_CENTS },
            totalEarnings: { increment: COMMISSION_AMOUNT_CENTS },
            affiliateEarnings: { increment: COMMISSION_AMOUNT_CENTS },
          },
        });
      }

      // Create purchase record with referral tracking
      return tx.purchase.create({
        data: {
          trackId: track.id,
          reviewerId: ReviewerProfile.id,
          amount: PURCHASE_AMOUNT_CENTS,
          referredByReviewerId: validatedReferral?.reviewerId ?? null,
          referralShareId: validatedReferral?.shareId ?? null,
          commissionPaid: validatedReferral ? COMMISSION_AMOUNT_CENTS : 0,
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
      where: { reviewerId: ReviewerProfile.id },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        Track: {
          select: {
            id: true,
            title: true,
            sourceUrl: true,
            ArtistProfile: {
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
