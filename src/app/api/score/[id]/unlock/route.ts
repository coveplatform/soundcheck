import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { UNLOCK_PRICE_CENTS } from "@/lib/score-subscription";

/**
 * Create a Stripe checkout session to unlock a report's full results.
 * [id] is the report slug.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;

    const report = await prisma.trackScoreReport.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        email: true,
        trackTitle: true,
        paidAt: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.paidAt) {
      // Already unlocked — just send them back to the report.
      return NextResponse.json({ alreadyUnlocked: true });
    }

    const stripe = getStripe();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: report.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MixReflect — Full Report Unlock",
              description: report.trackTitle
                ? `Unlock the full room read for "${report.trackTitle}"`
                : "Unlock your full room read",
            },
            unit_amount: UNLOCK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/report/${report.slug}?unlocked=1`,
      cancel_url: `${appUrl}/report/${report.slug}`,
      metadata: {
        type: "score_unlock",
        reportId: report.id,
        reportSlug: report.slug,
      },
    });

    await prisma.trackScoreReport.update({
      where: { id: report.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Score unlock checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}
