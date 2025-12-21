import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
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
    // Update payment record
    await prisma.payment.update({
      where: { stripeSessionId: session.id },
      data: {
        status: "COMPLETED",
        stripePaymentId: session.payment_intent as string,
        completedAt: new Date(),
      },
    });

    // Update track status to QUEUED
    await prisma.track.update({
      where: { id: trackId },
      data: {
        status: "QUEUED",
        paidAt: new Date(),
      },
    });

    // Update artist stats
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: { include: { user: true } } },
    });

    if (track) {
      await prisma.artistProfile.update({
        where: { id: track.artistId },
        data: {
          totalTracks: { increment: 1 },
          totalSpent: { increment: session.amount_total || 0 },
        },
      });
    }

    console.log(`Track ${trackId} queued for review`);

    // Trigger queue assignment to match reviewers
    await assignReviewersToTrack(trackId);

    if (track?.artist?.user?.email) {
      await sendTrackQueuedEmail(track.artist.user.email, track.title);
    }
  } catch (error) {
    console.error("Error handling checkout complete:", error);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    await prisma.payment.update({
      where: { stripeSessionId: session.id },
      data: { status: "FAILED" },
    });
  } catch (error) {
    console.error("Error handling checkout expired:", error);
  }
}
