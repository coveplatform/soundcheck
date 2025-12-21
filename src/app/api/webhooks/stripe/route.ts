import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { sendTrackQueuedEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET is not defined" },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutExpired(session);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const trackId = session.metadata?.trackId;

  if (!trackId) {
    console.error("No trackId in session metadata");
    return;
  }

  try {
    const stripe = getStripe();
    const completedAt = new Date();

    const updated = await prisma.payment.updateMany({
      where: { stripeSessionId: session.id, status: { not: "REFUNDED" } },
      data: {
        status: "COMPLETED",
        stripePaymentId: session.payment_intent as string,
        completedAt,
      },
    });

    if (updated.count === 0) {
      try {
        await prisma.payment.create({
          data: {
            trackId,
            amount: session.amount_total || 0,
            stripeSessionId: session.id,
            stripePaymentId: session.payment_intent as string,
            status: "COMPLETED",
            completedAt,
          },
        });
      } catch (error) {
        console.error("Payment create fallback failed:", error);
      }
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: { include: { user: true } }, payment: true },
    });

    if (!track) {
      console.error("Track not found for checkout completion:", trackId);
      return;
    }

    if (track.status === "CANCELLED") {
      if (track.payment?.status !== "REFUNDED" && session.payment_intent) {
        try {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
          }, {
            idempotencyKey: `webhook_refund_${session.id}`,
          });

          await prisma.payment.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: "REFUNDED" },
          });
        } catch (error) {
          console.error("Refund failed for cancelled track:", error);
        }
      }

      return;
    }

    const firstQueue = await prisma.track.updateMany({
      where: { id: trackId, paidAt: null, status: "PENDING_PAYMENT" },
      data: { status: "QUEUED", paidAt: completedAt },
    });

    if (firstQueue.count > 0) {
      await prisma.artistProfile.update({
        where: { id: track.artistId },
        data: {
          totalTracks: { increment: 1 },
          totalSpent: { increment: session.amount_total || 0 },
        },
      });

      console.log("Track queued for review", {
        trackId,
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
      });

      await assignReviewersToTrack(trackId);

      if (track?.artist?.user?.email) {
        await sendTrackQueuedEmail(track.artist.user.email, track.title);
      }
    } else {
      // replay/retry: safe to re-run assignment (idempotent) but avoid duplicate emails/stats
      await assignReviewersToTrack(trackId);
    }
  } catch (error) {
    console.error("Error handling checkout complete:", error);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
  } catch (error) {
    console.error("Error handling checkout expired:", error);
  }
}
