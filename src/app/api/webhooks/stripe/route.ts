import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { sendTrackQueuedEmail, sendAdminNewTrackNotification } from "@/lib/email";
import { finalizePaidCheckoutSession } from "@/lib/payments";
import type Stripe from "stripe";

const getUnixTimestamp = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

type StripeSubscriptionUnixFields = {
  current_period_end?: number | null;
  canceled_at?: number | null;
};

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
      // Handle both subscription and one-time payments
      if (session.mode === "subscription") {
        await handleSubscriptionCheckoutComplete(session);
      } else {
        await handleCheckoutComplete(session);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutExpired(session);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // Check if this is an external purchase (track sale) or track review payment
  const purchaseId = session.metadata?.purchaseId;

  if (purchaseId) {
    // External purchase - handle track sale
    await handleExternalPurchaseComplete(session, purchaseId);
    return;
  }

  // Track review payment (existing flow)
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

async function handleSubscriptionCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    const artistProfileId = session.metadata?.artistProfileId;
    const subscription = session.subscription as string;

    if (!artistProfileId || !subscription) {
      console.error("Missing artistProfileId or subscription in session metadata");
      return;
    }

    const stripe = getStripe();
    const subscriptionResponse = await stripe.subscriptions.retrieve(subscription);
    const subscriptionData: Stripe.Subscription =
      (subscriptionResponse as any).data ?? (subscriptionResponse as any);

    const subscriptionUnixFields =
      subscriptionData as unknown as StripeSubscriptionUnixFields;
    const currentPeriodEndUnix = getUnixTimestamp(
      subscriptionUnixFields.current_period_end
    );

    await prisma.$transaction(async (tx) => {
      await tx.artistProfile.update({
        where: { id: artistProfileId },
        data: {
          subscriptionId: subscriptionData.id,
          subscriptionStatus: subscriptionData.status,
          subscriptionTier: "pro",
          subscriptionCurrentPeriodEnd: currentPeriodEndUnix
            ? new Date(currentPeriodEndUnix * 1000)
            : null,
        },
      });

      await (tx.artistProfile as any).updateMany({
        where: {
          id: artistProfileId,
          OR: [
            { freeReviewCredits: { lt: 20 } },
            { freeReviewCredits: { equals: null } },
          ],
        },
        data: {
          freeReviewCredits: 20,
        },
      });
    });

    console.log(`Subscription activated for artist profile: ${artistProfileId}`);
  } catch (error) {
    console.error("Error handling subscription checkout complete:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const artistProfile = await prisma.artistProfile.findFirst({
      where: { subscriptionId: subscription.id },
    });

    if (!artistProfile) {
      console.error(`Artist profile not found for subscription: ${subscription.id}`);
      return;
    }

    await prisma.artistProfile.update({
      where: { id: artistProfile.id },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: (() => {
          const unix = getUnixTimestamp((subscription as any).current_period_end);
          return unix ? new Date(unix * 1000) : null;
        })(),
        subscriptionCanceledAt: (() => {
          const unix = getUnixTimestamp((subscription as any).canceled_at);
          return unix ? new Date(unix * 1000) : null;
        })(),
      },
    });

    console.log(`Subscription updated for artist profile: ${artistProfile.id}`);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const artistProfile = await prisma.artistProfile.findFirst({
      where: { subscriptionId: subscription.id },
    });

    if (!artistProfile) {
      console.error(`Artist profile not found for subscription: ${subscription.id}`);
      return;
    }

    await prisma.artistProfile.update({
      where: { id: artistProfile.id },
      data: {
        subscriptionStatus: "canceled",
        subscriptionCanceledAt: new Date(),
      },
    });

    console.log(`Subscription deleted for artist profile: ${artistProfile.id}`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handleExternalPurchaseComplete(
  session: Stripe.Checkout.Session,
  purchaseId: string
) {
  try {
    const purchase = await prisma.externalPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            sourceUrl: true,
            artist: {
              select: {
                id: true,
                artistName: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      console.error(`External purchase not found: ${purchaseId}`);
      return;
    }

    if (purchase.status === "COMPLETED") {
      console.log(`Purchase ${purchaseId} already completed, skipping`);
      return;
    }

    const completedAt = new Date();

    // Generate download URL (7 day expiry)
    const { generateDownloadUrl } = await import("@/lib/s3");
    const downloadUrl = await generateDownloadUrl(purchase.track.sourceUrl, 7 * 24 * 60 * 60);

    if (!downloadUrl) {
      console.error(`Failed to generate download URL for purchase: ${purchaseId}`);
      // Don't fail the purchase - can regenerate later
    }

    // Update purchase to completed
    await prisma.$transaction(async (tx) => {
      await tx.externalPurchase.update({
        where: { id: purchaseId },
        data: {
          status: "COMPLETED",
          stripePaymentIntentId: (session.payment_intent as string) || "unknown",
          downloadUrl,
          completedAt,
        },
      });

      // Credit artist
      await tx.artistProfile.update({
        where: { id: purchase.track.artist.id },
        data: {
          pendingBalance: { increment: purchase.artistAmount },
          totalEarnings: { increment: purchase.artistAmount },
        },
      });

      // Credit affiliate commission if applicable
      if (purchase.affiliateUserId && purchase.affiliateCommission > 0) {
        // Check if user is an artist or reviewer
        const user = await tx.user.findUnique({
          where: { id: purchase.affiliateUserId },
          select: {
            isArtist: true,
            isReviewer: true,
            artistProfile: { select: { id: true } },
            listenerProfile: { select: { id: true } },
          },
        });

        if (user?.isArtist && user.artistProfile) {
          // Credit to artist profile
          await tx.artistProfile.update({
            where: { id: user.artistProfile.id },
            data: {
              pendingBalance: { increment: purchase.affiliateCommission },
              totalEarnings: { increment: purchase.affiliateCommission },
            },
          });
        } else if (user?.isReviewer && user.listenerProfile) {
          // Credit to listener profile
          await tx.listenerProfile.update({
            where: { id: user.listenerProfile.id },
            data: {
              pendingBalance: { increment: purchase.affiliateCommission },
              totalEarnings: { increment: purchase.affiliateCommission },
              affiliateEarnings: { increment: purchase.affiliateCommission },
            },
          });
        }
      }

      // Update affiliate link stats
      if (purchase.affiliateCode) {
        await tx.trackAffiliateLink
          .update({
            where: { code: purchase.affiliateCode },
            data: {
              purchaseCount: { increment: 1 },
              totalRevenue: { increment: purchase.affiliateCommission },
            },
          })
          .catch((err) => {
            console.error("Failed to update affiliate link stats:", err);
          });
      }
    });

    // Send purchase confirmation email
    const { sendPurchaseConfirmationEmail } = await import("@/lib/email");
    await sendPurchaseConfirmationEmail({
      buyerEmail: purchase.buyerEmail,
      buyerName: purchase.buyerName || undefined,
      trackTitle: purchase.track.title,
      artistName: purchase.track.artist.artistName,
      downloadUrl: downloadUrl || undefined,
      purchaseId: purchase.id,
    }).catch((err) => {
      console.error("Failed to send purchase confirmation email:", err);
    });

    console.log(`External purchase completed: ${purchaseId}`);
  } catch (error) {
    console.error("Error handling external purchase complete:", error);
  }
}
