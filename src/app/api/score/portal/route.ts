import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

/**
 * Open the Stripe billing portal so a subscriber can update payment, view
 * invoices, or cancel. Auto-creates a portal configuration the first time so no
 * dashboard setup is needed.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const email = ((body?.email as string) || session?.user?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 400 });
    }

    const sub = await prisma.scoreSubscriber.findUnique({
      where: { email },
      select: { stripeCustomerId: true },
    });
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const stripe = getStripe();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/reports`,
      configuration: await ensurePortalConfig(stripe),
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}

let cachedConfigId: string | null = null;

/** Reuse (or create once) a billing-portal configuration so no manual setup is needed. */
async function ensurePortalConfig(stripe: Stripe): Promise<string> {
  if (cachedConfigId) return cachedConfigId;
  const existing = await stripe.billingPortal.configurations.list({ active: true, limit: 1 });
  if (existing.data.length) {
    cachedConfigId = existing.data[0].id;
    return cachedConfigId;
  }
  const cfg = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "MixReflect — manage your unlimited subscription" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
  cachedConfigId = cfg.id;
  return cachedConfigId;
}
