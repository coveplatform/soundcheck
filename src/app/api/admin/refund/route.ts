import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  trackId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackId } = schema.parse(body);

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        payment: true,
      },
    });

    if (!track || !track.payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (track.status === "CANCELLED" && track.payment.status === "REFUNDED") {
      return NextResponse.json({ success: true });
    }

    if (track.payment.status === "REFUNDED") {
      return NextResponse.json({ success: true });
    }

    // If track is already cancelled but payment is not refunded, allow refund to proceed.

    const startedReviews = await prisma.review.count({
      where: { trackId: track.id, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    });

    if (startedReviews > 0) {
      return NextResponse.json(
        { error: "Cannot refund once reviews have started" },
        { status: 400 }
      );
    }

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
        idempotencyKey: `admin_refund_${track.payment.id}`,
      }
    );

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: track.payment.id },
        data: { status: "REFUNDED" },
      }),
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
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Admin refund error:", error);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
