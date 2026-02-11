import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const bodySchema = z
  .object({
    kind: z.enum(["quantity", "pack"]),
    quantity: z.number().int().min(1).max(200).optional(),
    pack: z.union([z.literal(3), z.literal(10), z.literal(25)]).optional(),
    trackId: z.string().min(1).optional(),
  })
  .refine(
    (v) => (v.kind === "quantity" ? typeof v.quantity === "number" : typeof v.pack === "number"),
    { message: "Invalid purchase parameters" }
  );

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = bodySchema.parse(body);

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const successUrl = data.trackId
      ? `${appUrl}/submit?credits=success`
      : `${appUrl}/account?credits=success`;

    const cancelUrl = data.trackId
      ? `${appUrl}/submit?credits=canceled`
      : `${appUrl}/account?credits=canceled`;

    const currency = "usd";

    const packPricing: Record<3 | 10 | 25, { amountCents: number; credits: number }> = {
      3: { amountCents: 295, credits: 3 },
      10: { amountCents: 795, credits: 10 },
      25: { amountCents: 1495, credits: 25 },
    };

    const creditsToAdd =
      data.kind === "pack" ? packPricing[data.pack!].credits : data.quantity!;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items:
        data.kind === "pack"
          ? [
              {
                price_data: {
                  currency,
                  product_data: {
                    name: `Review credits (${packPricing[data.pack!].credits})`,
                    description: "Top up review credits",
                  },
                  unit_amount: packPricing[data.pack!].amountCents,
                },
                quantity: 1,
              },
            ]
          : [
              {
                price_data: {
                  currency,
                  product_data: {
                    name: "Review credits",
                    description: "Top up review credits",
                  },
                  unit_amount: 100,
                },
                quantity: data.quantity!,
              },
            ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "review_credits_topup",
        userId: session.user.id,
        artistProfileId: artistProfile.id,
        trackId: data.trackId ?? "",
        kind: data.kind,
        creditsToAdd: String(creditsToAdd),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    console.error("Review credits checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
