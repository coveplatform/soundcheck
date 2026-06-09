import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PRO_SALE_ACTIVE, PRO_SALE_PERCENT_OFF } from "@/lib/pricing";

// Cache the price ID in memory so we only create once per server lifecycle
let cachedPriceId: string | null = null;
// Cache the sale coupon ID per server lifecycle
let cachedSaleCouponId: string | null = null;
// Track whether we've synced the product description this server lifecycle
let productDescriptionSynced = false;

const PRO_MONTHLY_AMOUNT_CENTS = 2495; // $24.95
const PRO_PLAN_METADATA_KEY = "pro_monthly_v2";
const PRO_PRODUCT_DESCRIPTION = "30 credits every month, up to 10 reviews per track, 3 active slots, priority placement";

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
    query: `metadata["app"]:"mixreflect" AND metadata["plan"]:"${PRO_PLAN_METADATA_KEY}"`,
  });

  if (existingProducts.data.length > 0) {
    const product = existingProducts.data[0];
    // Keep description current
    await stripe.products.update(product.id, { description: PRO_PRODUCT_DESCRIPTION });
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
    description: PRO_PRODUCT_DESCRIPTION,
    metadata: {
      app: "mixreflect",
      plan: PRO_PLAN_METADATA_KEY,
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: PRO_MONTHLY_AMOUNT_CENTS,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: {
      app: "mixreflect",
      plan: PRO_PLAN_METADATA_KEY,
    },
  });

  cachedPriceId = price.id;
  console.log(`Created Stripe Pro Monthly price: ${price.id} (product: ${product.id})`);
  return cachedPriceId;
}

// Returns the Stripe coupon ID for the active sale, creating it if needed.
async function getOrCreateSaleCoupon(): Promise<string> {
  if (cachedSaleCouponId) return cachedSaleCouponId;
  const stripe = getStripe();
  const COUPON_ID = `mixreflect_pro_sale_${PRO_SALE_PERCENT_OFF}pct`;
  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    cachedSaleCouponId = existing.id;
    return cachedSaleCouponId;
  } catch {
    // Coupon doesn't exist yet — create it
    const coupon = await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: PRO_SALE_PERCENT_OFF,
      duration: "once",
      name: `MixReflect Pro ${PRO_SALE_PERCENT_OFF}% Off Launch Sale`,
      metadata: { app: "mixreflect", type: "pro_launch_sale" },
    });
    cachedSaleCouponId = coupon.id;
    console.log(`Created Stripe sale coupon: ${coupon.id}`);
    return cachedSaleCouponId;
  }
}

// Sync the Stripe product description once per server lifecycle.
// When STRIPE_PRO_MONTHLY_PRICE_ID is set we skip getOrCreateProMonthlyPrice,
// so we need a separate path to keep the existing product's description current.
async function syncProductDescription(priceId: string): Promise<void> {
  if (productDescriptionSynced) return;
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);
    const productId = typeof price.product === "string" ? price.product : (price.product as { id: string }).id;
    await stripe.products.update(productId, { description: PRO_PRODUCT_DESCRIPTION });
    productDescriptionSynced = true;
  } catch (err) {
    console.warn("Could not sync Pro product description:", err);
  }
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

    // Keep the Stripe product description current (fire-and-forget, once per cold start)
    if (process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
      syncProductDescription(priceId).catch(() => {});
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    // Resolve sale discount — apply a Stripe coupon when the sale is active.
    const saleDiscounts: { coupon: string }[] = [];
    if (PRO_SALE_ACTIVE) {
      const couponId = await getOrCreateSaleCoupon();
      saleDiscounts.push({ coupon: couponId });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      ...(saleDiscounts.length > 0 && { discounts: saleDiscounts }),
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
