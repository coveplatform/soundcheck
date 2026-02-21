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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    // Find artist profile by Stripe customer ID
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const artistProfile = await prisma.artistProfile.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });

    if (!artistProfile) {
      // Try metadata fallback
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
        },
      });
      console.log(
        `Subscription ${subscription.status} for artist ${artistProfileId} (via metadata)`
      );
      return;
    }

    await prisma.artistProfile.update({
      where: { id: artistProfile.id },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      },
    });

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


async function handleExternalPurchaseComplete(
  session: Stripe.Checkout.Session,
  purchaseId: string
) {
  try {
    const purchase = await prisma.externalPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        Track: {
          select: {
            id: true,
            title: true,
            sourceUrl: true,
            ArtistProfile: {
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
    const downloadUrl = await generateDownloadUrl(purchase.Track.sourceUrl, 7 * 24 * 60 * 60);

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
        where: { id: purchase.Track.ArtistProfile.id },
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
            ArtistProfile: { select: { id: true } },
            ReviewerProfile: { select: { id: true } },
          },
        });

        if (user?.isArtist && user.ArtistProfile) {
          // Credit to artist profile
          await tx.artistProfile.update({
            where: { id: user.ArtistProfile.id },
            data: {
              pendingBalance: { increment: purchase.affiliateCommission },
              totalEarnings: { increment: purchase.affiliateCommission },
            },
          });
        } else if (user?.isReviewer && user.ReviewerProfile) {
          // Credit to listener profile
          await tx.reviewerProfile.update({
            where: { id: user.ReviewerProfile.id },
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
      trackTitle: purchase.Track.title,
      artistName: purchase.Track.ArtistProfile.artistName,
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
