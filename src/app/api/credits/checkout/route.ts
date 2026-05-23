import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

import { CREDIT_PACK_CREDITS, CREDIT_PACK_PRICE_CENTS } from "@/lib/pricing";

const CREDIT_PACK_PRODUCT_NAME = "MixReflect Credit Pack";
const CREDIT_PACK_PRODUCT_DESCRIPTION = `${CREDIT_PACK_CREDITS} credits — never expire. Use whenever you want feedback on a track.`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        stripeCustomerId: true,
        User: { select: { email: true, name: true } },
      },
    });

    if (!artistProfile) {
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
    }

    const stripe = getStripe();

    // Create or reuse Stripe customer
    let customerId = artistProfile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: artistProfile.User.email,
        name: artistProfile.User.name || undefined,
        metadata: {
          userId: session.user.id,
          artistProfileId: artistProfile.id,
        },
      });
      customerId = customer.id;
      await prisma.artistProfile.update({
        where: { id: artistProfile.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Determine the return URL — defaults to /dashboard, but allow callers
    // to send users back to the page they came from (e.g. /submit, /tracks/:id/request-reviews)
    let returnPath = "/dashboard";
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body.returnPath === "string" && body.returnPath.startsWith("/")) {
        returnPath = body.returnPath;
      }
    } catch {
      // no body — that's fine
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const separator = returnPath.includes("?") ? "&" : "?";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: CREDIT_PACK_PRODUCT_NAME,
              description: CREDIT_PACK_PRODUCT_DESCRIPTION,
              metadata: {
                app: "mixreflect",
                product: "credit_pack",
              },
            },
            unit_amount: CREDIT_PACK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${returnPath}${separator}credits_added=1`,
      cancel_url: `${appUrl}${returnPath}${separator}credits_canceled=1`,
      metadata: {
        userId: session.user.id,
        artistProfileId: artistProfile.id,
        type: "credit_pack",
        credits: String(CREDIT_PACK_CREDITS),
      },
      payment_intent_data: {
        metadata: {
          userId: session.user.id,
          artistProfileId: artistProfile.id,
          type: "credit_pack",
          credits: String(CREDIT_PACK_CREDITS),
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Credit pack checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
