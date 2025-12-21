import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripePlatformDefaults, stripe } from "@/lib/stripe";

const MIN_PAYOUT_CENTS = 1000;

const requestPayoutSchema = z.object({
  amountCents: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to request payouts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amountCents } = requestPayoutSchema.parse(body);

    const reviewer = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isRestricted: true,
        completedOnboarding: true,
        onboardingQuizPassed: true,
        pendingBalance: true,
        stripeAccountId: true,
      },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    if (reviewer.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (!reviewer.completedOnboarding || !reviewer.onboardingQuizPassed) {
      return NextResponse.json(
        { error: "Please complete onboarding before requesting payouts" },
        { status: 403 }
      );
    }

    if (!reviewer.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    const requested = amountCents ?? reviewer.pendingBalance;

    if (requested < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        { error: `Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    if (requested > reviewer.pendingBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const payout = await prisma.payout.create({
      data: {
        reviewerId: reviewer.id,
        amount: requested,
        method: "STRIPE_CONNECT",
        status: "PROCESSING",
      },
      select: { id: true, amount: true, status: true },
    });

    await prisma.reviewerProfile.update({
      where: { id: reviewer.id },
      data: { pendingBalance: { decrement: requested } },
    });

    try {
      const defaults = await getStripePlatformDefaults();
      const currency = (process.env.STRIPE_CURRENCY ?? defaults.currency).toLowerCase();
      const transfer = await stripe.transfers.create({
        amount: requested,
        currency,
        destination: reviewer.stripeAccountId,
        metadata: {
          payoutId: payout.id,
          reviewerId: reviewer.id,
        },
      });

      const completed = await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "COMPLETED",
          externalId: transfer.id,
          processedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, payout: completed });
    } catch (transferError) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: "FAILED" },
      });

      await prisma.reviewerProfile.update({
        where: { id: reviewer.id },
        data: { pendingBalance: { increment: requested } },
      });

      const message =
        transferError instanceof Error ? transferError.message : "Unknown error";

      const code =
        typeof transferError === "object" &&
        transferError !== null &&
        "code" in transferError &&
        typeof (transferError as { code?: unknown }).code === "string"
          ? (transferError as { code: string }).code
          : undefined;

      console.error("Stripe transfer failed:", transferError);
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development" ? message : "Payout failed",
          ...(process.env.NODE_ENV === "development" && code ? { code } : {}),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error requesting payout:", error);
    return NextResponse.json(
      { error: "Failed to request payout" },
      { status: 500 }
    );
  }
}
