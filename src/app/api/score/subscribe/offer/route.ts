import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { isScoreSubscribed, scoreSubPrice } from "@/lib/score-subscription";

/**
 * Email-CTA entry point for the "50% off your first month of Unlimited" offer.
 * GET so it works as a plain link: applies the coupon and redirects straight
 * into Stripe checkout. Email-keyed like /api/score/subscribe — no session
 * needed, the recipient's address rides in on the query string.
 * Monthly plan only (a duration-once coupon on annual would halve the year).
 */

const OFFER_PERCENT_OFF = 50;

let cachedOfferCouponId: string | null = null;

async function getOrCreateOfferCoupon(): Promise<string> {
  if (cachedOfferCouponId) return cachedOfferCouponId;
  const stripe = getStripe();
  const COUPON_ID = `mixreflect_unlimited_first_month_${OFFER_PERCENT_OFF}pct`;
  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    cachedOfferCouponId = existing.id;
  } catch {
    const coupon = await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: OFFER_PERCENT_OFF,
      duration: "once",
      name: `MixReflect Unlimited — ${OFFER_PERCENT_OFF}% off first month`,
      metadata: { app: "mixreflect", type: "unlimited_first_month_offer" },
    });
    cachedOfferCouponId = coupon.id;
    console.log(`Created Stripe offer coupon: ${coupon.id}`);
  }
  return cachedOfferCouponId;
}

export async function GET(request: Request) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.redirect(`${appUrl}/#pricing`, 303);
    }

    if (await isScoreSubscribed(email)) {
      return NextResponse.redirect(`${appUrl}/dashboard`, 303);
    }

    const stripe = getStripe();
    const price = scoreSubPrice("monthly");
    const couponId = await getOrCreateOfferCoupon();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MixReflect — Unlimited",
              description: "Unlimited full report unlocks while subscribed.",
            },
            unit_amount: price.amount,
            recurring: { interval: price.interval },
          },
          quantity: 1,
        },
      ],
      discounts: [{ coupon: couponId }],
      success_url: `${appUrl}/dashboard?subscribed=1&plan=monthly`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: { type: "score_subscription", email, offer: "first_month_50" },
      subscription_data: {
        metadata: { type: "score_subscription", email, offer: "first_month_50" },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.redirect(`${appUrl}/#pricing`, 303);
    }
    return NextResponse.redirect(checkoutSession.url, 303);
  } catch (error) {
    console.error("Unlimited offer checkout error:", error);
    return NextResponse.redirect(`${appUrl}/#pricing`, 303);
  }
}
