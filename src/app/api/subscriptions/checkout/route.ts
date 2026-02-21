import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Cache the price ID in memory so we only create once per server lifecycle
let cachedPriceId: string | null = null;

const PRO_MONTHLY_AMOUNT_CENTS = 999; // $9.99

async function getOrCreateProMonthlyPrice(): Promise<string> {
  // 1. Check env var
  if (process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    return process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  }

  // 2. Check in-memory cache
  if (cachedPriceId) {
    return cachedPriceId;
  }

  const stripe = getStripe();

  // 3. Look for existing product by metadata
  const existingProducts = await stripe.products.search({
    query: 'metadata["app"]:"mixreflect" AND metadata["plan"]:"pro_monthly"',
  });

  if (existingProducts.data.length > 0) {
    const product = existingProducts.data[0];
    // Find the active price for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
      limit: 1,
    });
    if (prices.data.length > 0) {
      cachedPriceId = prices.data[0].id;
      return cachedPriceId;
    }
  }

  // 4. Create product + price
  const product = await stripe.products.create({
    name: "MixReflect Pro",
    description: "3 review slots, priority queue placement, Pro badge",
    metadata: {
      app: "mixreflect",
      plan: "pro_monthly",
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: PRO_MONTHLY_AMOUNT_CENTS,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: {
      app: "mixreflect",
      plan: "pro_monthly",
    },
  });

  cachedPriceId = price.id;
  console.log(`Created Stripe Pro Monthly price: ${price.id} (product: ${product.id})`);
  return cachedPriceId;
}

export async function POST() {
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
        subscriptionStatus: true,
        User: { select: { email: true, name: true } },
      },
    });

    if (!artistProfile) {
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
    }

    if (artistProfile.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "Already subscribed. Use the billing portal to manage your subscription." },
        { status: 400 }
      );
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

    const priceId = await getOrCreateProMonthlyPrice();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/pro?success=true`,
      cancel_url: `${appUrl}/pro?canceled=true`,
      metadata: {
        userId: session.user.id,
        artistProfileId: artistProfile.id,
        type: "pro_subscription",
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          artistProfileId: artistProfile.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
