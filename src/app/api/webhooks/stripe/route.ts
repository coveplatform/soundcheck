import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { sendTrackQueuedEmail, sendAdminNewTrackNotification } from "@/lib/email";
import { finalizePaidCheckoutSession } from "@/lib/payments";
import type Stripe from "stripe";


async function handleReleaseDecisionCheckout(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata!;
    const trackId = metadata.trackId;
    const userId = metadata.userId;
    const reviewCount = parseInt(metadata.reviewCount);

    if (!trackId || !userId) {
      console.error("Missing trackId or userId in Release Decision metadata");
      return;
    }

    // Update track to Release Decision package
    await prisma.track.update({
      where: { id: trackId },
      data: {
        packageType: "RELEASE_DECISION",
        reviewsRequested: reviewCount,
        status: "QUEUED",
        paidAt: new Date(),
      },
    });

    // Assign expert reviewers
    const { assignExpertReviewersToTrack } = await import("@/lib/queue");
    await assignExpertReviewersToTrack(trackId);

    // Send confirmation email
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        ArtistProfile: {
          include: { User: true },
        },
      },
    });

    if (track) {
      await sendTrackQueuedEmail(
        track.ArtistProfile.User.email,
        track.title
      );
    }
  } catch (error) {
    console.error("Error handling Release Decision checkout:", error);
  }
}


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
  let shouldProcess = true;
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const inserted = await prisma.$executeRaw`
      INSERT INTO "StripeWebhookEvent" ("id", "type", "expiresAt", "createdAt")
      VALUES (${event.id}, ${event.type}, ${expiresAt}, ${new Date()})
      ON CONFLICT ("id") DO NOTHING
    `;
    if (inserted === 0) {
      shouldProcess = false;
    }
  } catch (e) {
    console.error("Stripe webhook deduplication failed:", e);
  }

  if (!shouldProcess) {
    return NextResponse.json({ received: true });
  }

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

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // Check if this is an external purchase (track sale) or track review payment
  if (session.metadata?.type === "release_decision") {
    await handleReleaseDecisionCheckout(session);
    return;
  }

  const trackId = session.metadata?.trackId;

  if (!trackId) {
    console.error("No trackId in session metadata");
    return;
  }

  try {
    const stripe = getStripe();
    const completedAt = new Date();

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { ArtistProfile: { include: { User: true } }, Payment: true },
    });

    if (!track) {
      console.error("Track not found for checkout completion:", trackId);
      return;
    }

    if (track.status === "CANCELLED") {
      if (track.Payment?.status !== "REFUNDED" && session.payment_intent) {
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

    const result = await finalizePaidCheckoutSession({
      stripeSessionId: session.id,
      trackId,
      stripePaymentId: (session.payment_intent as string) || null,
      amountTotalCents:
        typeof session.amount_total === "number" ? session.amount_total : null,
      completedAt,
    });

    await assignReviewersToTrack(result.trackId);

    if (result.queuedNow && result.artistEmail && result.trackTitle) {
      await sendTrackQueuedEmail(result.artistEmail, result.trackTitle);

      // Notify admin of new paid submission
      await sendAdminNewTrackNotification({
        trackTitle: result.trackTitle,
        artistEmail: result.artistEmail,
        packageType: track.packageType,
        reviewsRequested: track.reviewsRequested,
        isPromo: false,
      });
    }
  } catch (error) {
    console.error("Error handling checkout complete:", error);
  }
}

const PRO_MONTHLY_CREDITS = 20;

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const newPeriodStart = new Date(subscription.current_period_start * 1000);
    const isActive = subscription.status === "active";

    let artistProfile = await prisma.artistProfile.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true, subscriptionCurrentPeriodStart: true },
    });

    if (!artistProfile) {
      const artistProfileId = subscription.metadata?.artistProfileId;
      if (!artistProfileId) {
        console.error(
          `No artist profile found for Stripe customer ${customerId}`
        );
        return;
      }

      await prisma.artistProfile.update({
        where: { id: artistProfileId },
        data: {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          stripeCustomerId: customerId,
          ...(isActive && {
            subscriptionCurrentPeriodStart: newPeriodStart,
            reviewCredits: { increment: PRO_MONTHLY_CREDITS },
            totalCreditsEarned: { increment: PRO_MONTHLY_CREDITS },
          }),
        },
      });
      console.log(
        `Subscription ${subscription.status} for artist ${artistProfileId} (via metadata)`
      );
      return;
    }

    const isNewPeriod =
      isActive &&
      (!artistProfile.subscriptionCurrentPeriodStart ||
        artistProfile.subscriptionCurrentPeriodStart.getTime() !== newPeriodStart.getTime());

    await prisma.artistProfile.update({
      where: { id: artistProfile.id },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        ...(isActive && { subscriptionCurrentPeriodStart: newPeriodStart }),
        ...(isNewPeriod && {
          reviewCredits: { increment: PRO_MONTHLY_CREDITS },
          totalCreditsEarned: { increment: PRO_MONTHLY_CREDITS },
        }),
      },
    });

    if (isNewPeriod) {
      console.log(
        `Granted ${PRO_MONTHLY_CREDITS} monthly credits to artist ${artistProfile.id}`
      );
    }
    console.log(
      `Subscription ${subscription.status} for artist ${artistProfile.id}`
    );
  } catch (error) {
    console.error("Error handling subscription change:", error);
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


