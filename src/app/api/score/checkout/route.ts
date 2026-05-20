import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { trackUrl, trackTitle, genre, notes, email } = body as {
      trackUrl: string;
      trackTitle?: string;
      genre: string;
      notes?: string;
      email: string;
    };

    if (!trackUrl || !genre || !email) {
      return NextResponse.json(
        { error: "trackUrl, genre, and email are required" },
        { status: 400 }
      );
    }

    const artistId = session?.user?.id
      ? await prisma.artistProfile
          .findUnique({ where: { userId: session.user.id }, select: { id: true } })
          .then((p) => p?.id ?? null)
      : null;

    // Create the pending report record
    const report = await prisma.trackScoreReport.create({
      data: {
        email,
        trackUrl,
        trackTitle: trackTitle || null,
        genre,
        notes: notes || null,
        artistId,
        status: "PENDING",
      },
    });

    const stripe = getStripe();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MixReflect Score Report",
              description: trackTitle
                ? `Track score for: ${trackTitle}`
                : "Track score & feedback from 5 real listeners",
              images: [],
            },
            unit_amount: 900, // $9.00
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/report/${report.slug}?paid=1`,
      cancel_url: `${appUrl}/submit-score?canceled=1`,
      metadata: {
        reportId: report.id,
        reportSlug: report.slug,
        email,
      },
    });

    // Store the Stripe session ID on the report
    await prisma.trackScoreReport.update({
      where: { id: report.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Score checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
