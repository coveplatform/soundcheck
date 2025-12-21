import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await request.json().catch(() => ({}));

    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artist: true,
        payment: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.status === "CANCELLED") {
      return NextResponse.json({ success: true, refunded: track.payment?.status === "REFUNDED" });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (track.status !== "PENDING_PAYMENT" && track.status !== "QUEUED") {
      return NextResponse.json(
        { error: "Track cannot be cancelled at this stage" },
        { status: 400 }
      );
    }

    const startedCount = await prisma.review.count({
      where: {
        trackId: track.id,
        status: { in: ["IN_PROGRESS", "COMPLETED"] },
      },
    });

    if (startedCount > 0) {
      return NextResponse.json(
        { error: "Track cannot be cancelled once reviews have started" },
        { status: 400 }
      );
    }

    let refunded = false;

    if (track.payment?.status === "COMPLETED") {
      if (!track.payment.stripePaymentId) {
        return NextResponse.json(
          { error: "Missing Stripe payment intent" },
          { status: 400 }
        );
      }

      const stripe = getStripe();

      await stripe.refunds.create(
        {
          payment_intent: track.payment.stripePaymentId,
        },
        {
          idempotencyKey: `track_cancel_${track.id}`,
        }
      );

      refunded = true;
    }

    await prisma.$transaction([
      prisma.track.update({
        where: { id: track.id },
        data: { status: "CANCELLED" },
      }),
      prisma.reviewQueue.deleteMany({
        where: { trackId: track.id },
      }),
      prisma.review.updateMany({
        where: { trackId: track.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        data: { status: "EXPIRED" },
      }),
      ...(track.payment
        ? [
            prisma.payment.update({
              where: { id: track.payment.id },
              data: {
                status: refunded
                  ? "REFUNDED"
                  : track.payment.status === "PENDING"
                  ? "FAILED"
                  : track.payment.status,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, refunded });
  } catch (error) {
    console.error("Cancel track error:", error);
    return NextResponse.json(
      { error: "Failed to cancel track" },
      { status: 500 }
    );
  }
}
