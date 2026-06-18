import { NextResponse, after } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { sendTrackQueuedEmail, sendAdminNewTrackNotification } from "@/lib/email";
import { finalizePaidCheckoutSession } from "@/lib/payments";
import { activateSubscriber, updateSubscriberStatus } from "@/lib/score-subscription";
import { decideRoomEligibility } from "@/lib/score-review";
import { generateAndStoreReport, regenerateDeepReport } from "@/lib/score-report-ai";
import type Stripe from "stripe";

// Deep DSP (Replicate stems) + LLM no longer fit in 60s — especially on a
// Replicate cold start. Needs Fluid compute / Pro for >60.
export const maxDuration = 300;


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

async function handleScoreUnlockCheckout(session: Stripe.Checkout.Session) {
  try {
    const reportId = session.metadata?.reportId;
    if (!reportId) {
      console.error("Missing reportId in score_unlock metadata", { sessionId: session.id });
      return;
    }

    // One-off unlock: mark paid + room-eligible. The room is a claim pool now —
    // setting paidAt with humanRoomSkipped=false (the default) makes the track
    // available for real reviewers to pick up; no push-assignment needed.
    await prisma.trackScoreReport.update({
      where: { id: reportId },
      data: {
        paidAt: new Date(),
        status: "IN_REVIEW",
        stripeSessionId: session.id,
        humanRoomSkipped: false,
      },
    });

    // Build the read now that they've paid. Two cases, both idempotent:
    //  • SEALED report (pay-to-continue wall): score is null — generateAndStoreReport
    //    runs the full instant read, then auto-chains the deep read (it re-reads
    //    paidAt on completion, which we just set above).
    //  • Already-generated report (the report-page unlock): generateAndStoreReport
    //    no-ops on the in-flight claim, so the explicit deep read below runs.
    after(async () => {
      try {
        await generateAndStoreReport(reportId);
      } catch (err) {
        console.error("Error generating report after unlock:", err);
      }
      await regenerateDeepReport(reportId).catch((err) =>
        console.error("Error generating deep report after unlock:", err)
      );
    });

    console.log(`Unlocked score report ${reportId} (session ${session.id})`);
  } catch (error) {
    console.error("Error handling score unlock checkout:", error);
  }
}

async function handleScoreSubscriptionCheckout(session: Stripe.Checkout.Session) {
  try {
    const email = session.metadata?.email;
    if (!email) {
      console.error("Missing email in score_subscription metadata", { sessionId: session.id });
      return;
    }
    await activateSubscriber({
      email,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripeSubscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null,
    });

    // Subscribed FROM a specific report (the slug rides in checkout metadata):
    // that track gets the full subscriber treatment — the back-unlock above
    // deliberately skips rooms for the whole backlog, but the report they were
    // sold on earns a real room (within the monthly cap) + the deep read.
    // decideRoomEligibility only ever denies, so un-skip first; it re-skips if
    // the cycle's rounds are spent.
    const fromReport = session.metadata?.fromReport;
    if (fromReport) {
      const report = await prisma.trackScoreReport.findUnique({
        where: { slug: fromReport },
        select: { id: true, email: true },
      });
      if (report && report.email.trim().toLowerCase() === email.trim().toLowerCase()) {
        await prisma.trackScoreReport.update({
          where: { id: report.id },
          data: { humanRoomSkipped: false, status: "IN_REVIEW" },
        });
        await decideRoomEligibility(email, report.id);
        // activateSubscriber above back-unlocked all their reports (set paidAt),
        // so a SEALED row (pay-to-continue → went unlimited) now generates here:
        // generateAndStoreReport builds the instant read and auto-chains the deep
        // read (it sees paidAt set). No-ops if the read already landed.
        after(async () => {
          try {
            await generateAndStoreReport(report.id);
          } catch (err) {
            console.error("Error generating report after subscribe:", err);
          }
          await regenerateDeepReport(report.id).catch((err) =>
            console.error("Error generating deep report after subscribe:", err)
          );
        });
      }
    }

    console.log(`Activated score subscription for ${email} (session ${session.id})`);
  } catch (error) {
    console.error("Error handling score subscription checkout:", error);
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  if (session.metadata?.type === "score_unlock") {
    await handleScoreUnlockCheckout(session);
    return;
  }

  if (session.metadata?.type === "score_subscription") {
    await handleScoreSubscriptionCheckout(session);
    return;
  }

  if (session.metadata?.type === "release_decision") {
    await handleReleaseDecisionCheckout(session);
    return;
  }

  if (session.metadata?.type === "credit_pack") {
    await handleCreditPackCheckout(session);
    return;
  }

  // Pro subscription checkouts are activated via customer.subscription.created — nothing to do here
  if (session.metadata?.type === "pro_subscription") {
    return;
  }

  const trackId = session.metadata?.trackId;

  if (!trackId) {
    console.error("No trackId in session metadata", { sessionId: session.id, metadata: session.metadata });
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

const PRO_MONTHLY_CREDITS = 30;

async function handleCreditPackCheckout(session: Stripe.Checkout.Session) {
  try {
    const artistProfileId = session.metadata?.artistProfileId;
    const creditsRaw = session.metadata?.credits;
    const credits = creditsRaw ? parseInt(creditsRaw, 10) : NaN;

    if (!artistProfileId || !Number.isFinite(credits) || credits <= 0) {
      console.error("Credit pack checkout missing metadata", {
        sessionId: session.id,
        metadata: session.metadata,
      });
      return;
    }

    await prisma.artistProfile.update({
      where: { id: artistProfileId },
      data: {
        reviewCredits: { increment: credits },
        totalCreditsEarned: { increment: credits },
      },
    });

    console.log(
      `Granted ${credits} credit-pack credits to artist ${artistProfileId} (session ${session.id})`
    );
  } catch (error) {
    console.error("Error handling credit pack checkout:", error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    // Score-product "unlimited" subscriptions are tracked in ScoreSubscriber, not
    // ArtistProfile — route them away from the credits/Pro logic below.
    if (subscription.metadata?.type === "score_subscription") {
      const periodEndSeconds = subscription.items?.data?.[0]?.current_period_end;
      await updateSubscriberStatus({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
      });
      return;
    }

    const periodStartSeconds = subscription.items?.data?.[0]?.current_period_start;
    const newPeriodStart = periodStartSeconds ? new Date(periodStartSeconds * 1000) : new Date();
    const isActive = subscription.status === "active";

    const artistProfile = await prisma.artistProfile.findFirst({
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


