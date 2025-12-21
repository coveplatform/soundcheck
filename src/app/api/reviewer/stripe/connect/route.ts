import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripePlatformDefaults, stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const reviewer = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, stripeAccountId: true },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const reset =
      url.searchParams.get("reset") === "1" ||
      url.searchParams.get("reconnect") === "1";

    let accountId = reviewer.stripeAccountId;

    if (reset && accountId) {
      await prisma.reviewerProfile.update({
        where: { id: reviewer.id },
        data: { stripeAccountId: null },
      });
      accountId = null;
    }

    if (!accountId) {
      const defaults = await getStripePlatformDefaults();
      const country = process.env.STRIPE_CONNECT_COUNTRY ?? defaults.country;
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: user?.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          reviewerId: reviewer.id,
        },
      });

      accountId = account.id;

      await prisma.reviewerProfile.update({
        where: { id: reviewer.id },
        data: { stripeAccountId: accountId },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/reviewer/earnings?stripe=refresh`,
      return_url: `${baseUrl}/reviewer/earnings?stripe=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating Stripe connect link:", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Failed to create Stripe connect link",
      },
      { status: 500 }
    );
  }
}
