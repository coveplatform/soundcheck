import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewer = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { stripeAccountId: true },
    });

    if (!reviewer?.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    const loginLink = await stripe.accounts.createLoginLink(
      reviewer.stripeAccountId
    );

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("Error creating Stripe dashboard link:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe dashboard link" },
      { status: 500 }
    );
  }
}
