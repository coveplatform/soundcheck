import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { isScoreSubscribed, scoreSubPrice } from "@/lib/score-subscription";

/**
 * Start the "unlimited unlocks" subscription ($9.95/mo). Email-keyed: uses the
 * session email, or one passed in the body.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const { email, returnTo, plan } = (body ?? {}) as {
      email?: string;
      returnTo?: string;
      plan?: "monthly" | "annual";
    };
    const planKey = plan === "annual" ? "annual" : "monthly";
    const price = scoreSubPrice(planKey);

    const effectiveEmail = (email || session?.user?.email || "").trim();
    if (!effectiveEmail) {
      return NextResponse.json(
        { error: "Sign in or enter an email first." },
        { status: 400 }
      );
    }

    if (await isScoreSubscribed(effectiveEmail)) {
      return NextResponse.json({ alreadySubscribed: true });
    }

    const stripe = getStripe();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const success = returnTo?.startsWith("/") ? returnTo : "/dashboard";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: effectiveEmail,
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
      // `plan` lets the success page report the right conversion value to ad pixels.
      success_url: `${appUrl}${success}?subscribed=1&plan=${planKey}`,
      cancel_url: `${appUrl}${success}`,
      metadata: { type: "score_subscription", email: effectiveEmail },
      subscription_data: {
        metadata: { type: "score_subscription", email: effectiveEmail },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Score subscribe checkout error:", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
