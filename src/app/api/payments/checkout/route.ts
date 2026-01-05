import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getStripe, getStripePlatformDefaults } from "@/lib/stripe";
import { PACKAGES, PackageType } from "@/lib/metadata";
import { assignReviewersToTrack } from "@/lib/queue";
import { sendAdminNewTrackNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bypassPayments =
      process.env.NODE_ENV !== "production" &&
      process.env.BYPASS_PAYMENTS === "true";

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;

    const { trackId, useFreeCredit } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 });
    }

    // Get track with artist profile (includes freeReviewCredits)
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: {
          include: { user: true },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Verify ownership
    if (track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already paid
    if (track.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Track already submitted for review" },
        { status: 400 }
      );
    }

    // Check if user wants to use free credit and has one available
    const hasFreeCredit = track.artist.freeReviewCredits > 0;
    const useFreeCreditForPayment = useFreeCredit && hasFreeCredit;

    // Get package details
    const packageDetails = PACKAGES[track.packageType as PackageType];
    if (!packageDetails) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    if (bypassPayments || useFreeCreditForPayment) {
      const paidAt = new Date();

      // Free credits get 1 review only
      const freeReviewCount = useFreeCreditForPayment ? 1 : undefined;

      const updated = await prisma.track.updateMany({
        where: { id: track.id, status: "PENDING_PAYMENT", paidAt: null },
        data: {
          status: "QUEUED",
          paidAt,
          ...(freeReviewCount && { reviewsRequested: freeReviewCount }),
          ...(useFreeCreditForPayment && { promoCode: "FREE_CREDIT" }),
        },
      });

      if (updated.count > 0) {
        // Create $0 payment record for free credits
        if (useFreeCreditForPayment) {
          await prisma.payment.create({
            data: {
              trackId: track.id,
              amount: 0,
              stripeSessionId: `free_credit_${track.id}_${paidAt.getTime()}`,
              stripePaymentId: null,
              status: "COMPLETED",
              completedAt: paidAt,
            },
          });
        }

        // Update artist profile
        if (useFreeCreditForPayment) {
          await prisma.artistProfile.update({
            where: { id: track.artistId },
            data: {
              totalTracks: { increment: 1 },
              freeReviewCredits: { decrement: 1 },
            },
          });
        } else {
          await prisma.artistProfile.update({
            where: { id: track.artistId },
            data: {
              totalTracks: { increment: 1 },
            },
          });
        }

        await assignReviewersToTrack(track.id);

        // Notify admin of new track submission
        await sendAdminNewTrackNotification({
          trackTitle: track.title,
          artistEmail: track.artist.user.email,
          packageType: track.packageType,
          reviewsRequested: freeReviewCount ?? packageDetails.reviews,
          isPromo: false,
          promoCode: useFreeCreditForPayment ? "FREE_CREDIT" : undefined,
        });
      }

      const sessionType = useFreeCreditForPayment ? "free_credit" : "bypass";
      return NextResponse.json({
        url: `${baseUrl}/artist/submit/success?session_id=${sessionType}_${track.id}`,
        package: track.packageType,
        amount: packageDetails.price,
        bypassed: true,
        usedFreeCredit: useFreeCreditForPayment,
      });
    }

    const envCurrency = process.env.STRIPE_CURRENCY;
    let currency = envCurrency?.toLowerCase();
    if (!currency) {
      try {
        const defaults = await getStripePlatformDefaults();
        currency = defaults.currency.toLowerCase();
      } catch {
        currency = "aud";
      }
    }

    const stripe = getStripe();

    // Create Stripe checkout session with multiple payment methods
    // Apple Pay & Google Pay are automatic with "card" on compatible devices
    // PayPal and Link (one-click checkout) are explicitly enabled
    const checkoutSession = await stripe.checkout.sessions.create({
      automatic_payment_methods: {
        enabled: true,
      },
      mode: "payment",
      customer_email: track.artist.user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `MixReflect ${packageDetails.name} Package`,
              description: `${packageDetails.reviews} reviews for "${track.title}"`,
            },
            unit_amount: packageDetails.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        trackId: track.id,
        packageType: track.packageType,
        userId: session.user.id,
      },
      success_url: `${baseUrl}/artist/submit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/artist/tracks/${track.id}`,
      // Enable phone number collection for better conversion
      phone_number_collection: {
        enabled: false,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    } as Stripe.Checkout.SessionCreateParams);

    // Create or update payment record
    await prisma.payment.upsert({
      where: { trackId: track.id },
      create: {
        trackId: track.id,
        amount: packageDetails.price,
        stripeSessionId: checkoutSession.id,
        status: "PENDING",
      },
      update: {
        amount: packageDetails.price,
        stripeSessionId: checkoutSession.id,
        status: "PENDING",
        completedAt: null, // Reset if somehow it was set
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    if (error instanceof Error && error.message) {
      const safeMessage = error.message;
      if (safeMessage.includes("STRIPE_SECRET_KEY is not defined")) {
        return NextResponse.json(
          { error: safeMessage },
          { status: 500 }
        );
      }
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          stripe: {
            type: error.type,
            code: error.code,
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
