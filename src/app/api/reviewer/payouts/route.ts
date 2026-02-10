import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripePlatformDefaults } from "@/lib/stripe";

const MIN_PAYOUT_CENTS = 1000;
const PAYOUT_DELAY_DAYS = 7;

const requestPayoutSchema = z.object({
  amountCents: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bypassPayments =
      process.env.NODE_ENV !== "production" &&
      process.env.BYPASS_PAYMENTS === "true";

    const body = await request.json();
    const { amountCents } = requestPayoutSchema.parse(body);

    const prismaWithListener = prisma as unknown as typeof prisma & {
      reviewerProfile?: typeof prisma.reviewerProfile;
    };
    const reviewerProfileModel =
      prismaWithListener.reviewerProfile ?? prisma.reviewerProfile;
    const reviewer = await reviewerProfileModel.findUnique({
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

    if (ReviewerProfile.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (!ReviewerProfile.completedOnboarding || !ReviewerProfile.onboardingQuizPassed) {
      return NextResponse.json(
        { error: "Please complete onboarding before requesting payouts" },
        { status: 403 }
      );
    }

    const requested = amountCents ?? ReviewerProfile.pendingBalance;

    if (requested > ReviewerProfile.pendingBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    if (bypassPayments) {
      let payout;
      try {
        payout = await prisma.$transaction(async (tx) => {
          const reserved = await tx.reviewerProfile.updateMany({
            where: {
              id: ReviewerProfile.id,
              pendingBalance: { gte: requested },
            },
            data: { pendingBalance: { decrement: requested } },
          });

          if (reserved.count === 0) {
            throw new Error("Insufficient balance");
          }

          return tx.payout.create({
            data: {
              reviewerId: ReviewerProfile.id,
              amount: requested,
              method: "MANUAL",
              status: "COMPLETED",
              processedAt: new Date(),
            },
          });
        });
      } catch (e) {
        if (e instanceof Error && e.message === "Insufficient balance") {
          return NextResponse.json(
            { error: "Insufficient balance" },
            { status: 400 }
          );
        }
        throw e;
      }

      return NextResponse.json({ success: true, payout, bypassed: true });
    }

    const stripeAccountId = ReviewerProfile.stripeAccountId;
    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    try {
      const rows = await prisma.$queryRaw<Array<{ stripeConnectedAt: Date | null }>>`
        SELECT "stripeConnectedAt"
        FROM "ReviewerProfile"
        WHERE "id" = ${ReviewerProfile.id}
        LIMIT 1
      `;
      const connectedAt = rows[0]?.stripeConnectedAt;
      if (!connectedAt) {
        return NextResponse.json(
          { error: `Payouts are available ${PAYOUT_DELAY_DAYS} days after connecting Stripe` },
          { status: 403 }
        );
      }

      const daysSince = Math.floor(
        (Date.now() - connectedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < PAYOUT_DELAY_DAYS) {
        return NextResponse.json(
          { error: `Payouts are available ${PAYOUT_DELAY_DAYS} days after connecting Stripe` },
          { status: 403 }
        );
      }
    } catch {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Payouts are temporarily unavailable" },
          { status: 503 }
        );
      }
    }

    if (requested < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        { error: `Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    let payout;
    try {
      payout = await prisma.$transaction(async (tx) => {
        const reserved = await tx.reviewerProfile.updateMany({
          where: {
            id: ReviewerProfile.id,
            pendingBalance: { gte: requested },
          },
          data: { pendingBalance: { decrement: requested } },
        });

        if (reserved.count === 0) {
          throw new Error("Insufficient balance");
        }

        return tx.payout.create({
          data: {
            reviewerId: ReviewerProfile.id,
            amount: requested,
            method: "STRIPE_CONNECT",
            status: "PROCESSING",
          },
          select: { id: true, amount: true, status: true },
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message === "Insufficient balance") {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 }
        );
      }
      throw e;
    }

    try {
      const stripe = getStripe();
      const defaults = await getStripePlatformDefaults();
      const currency = (process.env.STRIPE_CURRENCY ?? defaults.currency).toLowerCase();
      const transfer = await stripe.transfers.create(
        {
          amount: requested,
          currency,
          destination: stripeAccountId,
          metadata: {
            payoutId: payout.id,
            reviewerId: ReviewerProfile.id,
          },
        },
        {
          idempotencyKey: `payout_${payout.id}`,
        }
      );

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
      await prisma.$transaction(async (tx) => {
        const updated = await tx.payout.updateMany({
          where: { id: payout.id, status: "PROCESSING" },
          data: { status: "FAILED" },
        });

        if (updated.count > 0) {
          await tx.reviewerProfile.update({
            where: { id: ReviewerProfile.id },
            data: { pendingBalance: { increment: requested } },
          });
        }
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
