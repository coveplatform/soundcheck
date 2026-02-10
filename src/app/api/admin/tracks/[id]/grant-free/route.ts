import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        Payment: true,
        ArtistProfile: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: `Track is not pending payment (status: ${track.status})` },
        { status: 400 }
      );
    }

    // Only allow if no payment or payment is still PENDING
    if (track.Payment && track.Payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Track already has a completed payment" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create or update payment record to $0 COMPLETED, and queue the track
    const paymentOp = track.Payment
      ? prisma.payment.update({
          where: { id: track.Payment.id },
          data: {
            amount: 0,
            stripeSessionId: `admin_free_${track.id}_${now.getTime()}`,
            stripePaymentId: null,
            status: "COMPLETED",
            completedAt: now,
          },
        })
      : prisma.payment.create({
          data: {
            trackId: track.id,
            amount: 0,
            stripeSessionId: `admin_free_${track.id}_${now.getTime()}`,
            stripePaymentId: null,
            status: "COMPLETED",
            completedAt: now,
          },
        });

    await prisma.$transaction([
      paymentOp,
      prisma.track.update({
        where: { id: track.id },
        data: {
          status: "QUEUED",
          paidAt: now,
        },
      }),
      prisma.artistProfile.update({
        where: { id: track.artistId },
        data: {
          totalTracks: { increment: 1 },
          // Don't increment totalSpent since it's free
        },
      }),
    ]);

    // Assign reviewers to the track
    await assignReviewersToTrack(track.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grant free track error:", error);
    return NextResponse.json({ error: "Failed to grant free track" }, { status: 500 });
  }
}
