import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to continue" },
        { status: 403 }
      );
    }

    const bypassPayments =
      process.env.NODE_ENV !== "production" &&
      process.env.BYPASS_PAYMENTS === "true";

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;

    const { trackId, promoCode, useFreeCredit } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 });
    }

    // Check if promo code is valid
    const validPromoCodes = (process.env.PROMO_CODES ?? "")
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
    let isValidPromo =
      promoCode && validPromoCodes.includes(promoCode.toUpperCase());

    // Check if user already used a promo code before
    if (isValidPromo) {
      const existingPromoUsage = await prisma.payment.findFirst({
        where: {
          stripeSessionId: { startsWith: "promo_" },
          track: {
            artist: {
              userId: session.user.id,
            },
          },
        },
      });

      if (existingPromoUsage) {
        return NextResponse.json(
          { error: "You have already used a promo code" },
          { status: 400 }
        );
      }
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

    if (bypassPayments || isValidPromo || useFreeCreditForPayment) {
      const paidAt = new Date();

      // Promo codes and free credits get 1 review only
      const freeReviewCount = (isValidPromo || useFreeCreditForPayment) ? 1 : undefined;

      const updated = await prisma.track.updateMany({
        where: { id: track.id, status: "PENDING_PAYMENT", paidAt: null },
        data: {
          status: "QUEUED",
          paidAt,
          ...(freeReviewCount && { reviewsRequested: freeReviewCount }),
          ...(isValidPromo && { promoCode: promoCode.toUpperCase() }),
          ...(useFreeCreditForPayment && { promoCode: "FREE_CREDIT" }),
        },
      });

      if (updated.count > 0) {
        // Create $0 payment record for promo codes or free credits
        if (isValidPromo || useFreeCreditForPayment) {
          const sessionIdPrefix = useFreeCreditForPayment ? "free_credit" : `promo_${promoCode.toUpperCase()}`;
          await prisma.payment.create({
            data: {
              trackId: track.id,
              amount: 0,
              stripeSessionId: `${sessionIdPrefix}_${track.id}_${paidAt.getTime()}`,
              stripePaymentId: null,
              status: "COMPLETED",
              completedAt: paidAt,
            },
          });
        }

        // Decrement free credit if used
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
          isPromo: isValidPromo,
          promoCode: isValidPromo ? promoCode.toUpperCase() : useFreeCreditForPayment ? "FREE_CREDIT" : undefined,
        });
      }

      const sessionType = useFreeCreditForPayment ? "free_credit" : (isValidPromo ? "promo" : "bypass");
      return NextResponse.json({
        url: `${baseUrl}/artist/submit/success?session_id=${sessionType}_${track.id}`,
        package: track.packageType,
        amount: packageDetails.price,
        bypassed: true,
        usedFreeCredit: useFreeCreditForPayment,
      });
    }

    const defaults = await getStripePlatformDefaults();
    const currency = (process.env.STRIPE_CURRENCY ?? defaults.currency).toLowerCase();

    const stripe = getStripe();

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
    });

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
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
