import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * Verifies subscription status by checking Stripe directly.
 * Used after checkout redirect to handle webhook delay race condition.
 *
 * This endpoint:
 * 1. Checks local DB for subscription status
 * 2. If not active but stripeCustomerId exists, checks Stripe directly
 * 3. If Stripe shows active subscription, updates local DB
 */
export async function POST(request: Request) {
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
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionCurrentPeriodEnd: true,
        reviewCredits: true,
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: "Artist profile not found" },
        { status: 404 }
      );
    }

    // If already active in DB, return immediately
    if (artistProfile.subscriptionStatus === "active") {
      return NextResponse.json({
        status: "active",
        tier: artistProfile.subscriptionTier,
        currentPeriodEnd: artistProfile.subscriptionCurrentPeriodEnd,
        credits: artistProfile.reviewCredits,
        source: "database",
      });
    }

    // No Stripe customer yet - definitely not subscribed
    if (!artistProfile.stripeCustomerId) {
      return NextResponse.json({
        status: artistProfile.subscriptionStatus || "none",
        tier: null,
        currentPeriodEnd: null,
        credits: artistProfile.reviewCredits,
        source: "database",
      });
    }

    // Check Stripe directly for active subscriptions
    const stripe = getStripe();

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: artistProfile.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];

        // Active subscription found in Stripe but not in DB - sync it
        const currentPeriodEndUnix = (subscription as unknown as { current_period_end?: number }).current_period_end;
        const currentPeriodEnd = currentPeriodEndUnix
          ? new Date(currentPeriodEndUnix * 1000)
          : null;

        // Update local database to match Stripe
        const updatedProfile = await prisma.artistProfile.update({
          where: { id: artistProfile.id },
          data: {
            subscriptionId: subscription.id,
            subscriptionStatus: "active",
            subscriptionTier: "pro",
            subscriptionCurrentPeriodEnd: currentPeriodEnd,
            // Grant 10 credits for Pro activation
            reviewCredits: { increment: 10 },
          },
        });

        console.log(
          `Subscription synced from Stripe for artist profile: ${artistProfile.id}`
        );

        return NextResponse.json({
          status: "active",
          tier: "pro",
          currentPeriodEnd: currentPeriodEnd,
          credits: updatedProfile.reviewCredits,
          source: "stripe_sync",
        });
      }

      // No active subscription in Stripe
      return NextResponse.json({
        status: artistProfile.subscriptionStatus || "none",
        tier: artistProfile.subscriptionTier,
        currentPeriodEnd: artistProfile.subscriptionCurrentPeriodEnd,
        credits: artistProfile.reviewCredits,
        source: "stripe_verified",
      });
    } catch (stripeError) {
      console.error("Stripe verification error:", stripeError);
      // Fall back to database state if Stripe check fails
      return NextResponse.json({
        status: artistProfile.subscriptionStatus || "none",
        tier: artistProfile.subscriptionTier,
        currentPeriodEnd: artistProfile.subscriptionCurrentPeriodEnd,
        credits: artistProfile.reviewCredits,
        source: "database_fallback",
      });
    }
  } catch (error) {
    console.error("Subscription verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}
