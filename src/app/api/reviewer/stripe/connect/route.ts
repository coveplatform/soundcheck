import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;

    const bypassPayments =
      process.env.NODE_ENV !== "production" &&
      process.env.BYPASS_PAYMENTS === "true";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const reviewer = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        stripeAccountId: true,
        isRestricted: true,
        completedOnboarding: true,
        onboardingQuizPassed: true,
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
        { error: "Please complete onboarding before connecting Stripe" },
        { status: 403 }
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

    if (bypassPayments) {
      if (!accountId) {
        const connectedAt = new Date();
        accountId = `bypass_${reviewer.id}`;
        await prisma.reviewerProfile.update({
          where: { id: reviewer.id },
          data: { stripeAccountId: accountId },
        });
        await prisma.$executeRaw`
          UPDATE "ReviewerProfile"
          SET "stripeConnectedAt" = ${connectedAt}, "updatedAt" = ${connectedAt}
          WHERE "id" = ${reviewer.id} AND "stripeConnectedAt" IS NULL
        `;
      }

      return NextResponse.json({
        url: `${baseUrl}/listener/earnings?stripe=bypass`,
        bypassed: true,
      });
    }

    if (!accountId) {
      const stripe = getStripe();

      const rows = await prisma.$queryRaw<Array<{ country: string | null }>>`
        SELECT "country"
        FROM "ReviewerProfile"
        WHERE "id" = ${reviewer.id}
        LIMIT 1
      `;

      const country = rows[0]?.country?.trim().toUpperCase();
      if (!country) {
        return NextResponse.json(
          { error: "Please set your country before connecting Stripe" },
          { status: 400 }
        );
      }

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
      const connectedAt = new Date();

      await prisma.reviewerProfile.update({
        where: { id: reviewer.id },
        data: { stripeAccountId: accountId },
      });

      await prisma.$executeRaw`
        UPDATE "ReviewerProfile"
        SET "stripeConnectedAt" = ${connectedAt}, "updatedAt" = ${connectedAt}
        WHERE "id" = ${reviewer.id} AND "stripeConnectedAt" IS NULL
      `;
    }

    const stripe = getStripe();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/listener/earnings?stripe=refresh`,
      return_url: `${baseUrl}/listener/earnings?stripe=return`,
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
