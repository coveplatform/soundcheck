import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const requestSchema = z.object({
  reviewCount: z.number().int().min(1).max(50),
  requestProReviewers: z.boolean(),
  requestExpertReviewers: z.boolean(),
  rushDelivery: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;
    const body = await request.json();
    const validated = requestSchema.parse(body);

    const {
      reviewCount,
      requestProReviewers,
      requestExpertReviewers,
      rushDelivery,
    } = validated;

    // Fetch track with artist profile
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        ArtistProfile: {
          include: {
            User: true,
            Genre_ArtistGenres: true,
          },
        },
        Genre: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Verify ownership
    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate costs
    const creditCost = reviewCount;
    let cashAddOnCents = 0;
    const addOnDescriptions: string[] = [];

    if (requestExpertReviewers) {
      // Industry experts cost $10/review (replaces Pro tier)
      cashAddOnCents += reviewCount * 1000;
      addOnDescriptions.push(`Industry Expert reviews (${reviewCount} × $10)`);
    } else if (requestProReviewers) {
      // Pro reviewers cost $2/review
      cashAddOnCents += reviewCount * 200;
      addOnDescriptions.push(`Pro Reviewer upgrades (${reviewCount} × $2)`);
    }

    if (rushDelivery) {
      cashAddOnCents += 1000; // $10 flat fee
      addOnDescriptions.push("Rush Delivery (24h guarantee)");
    }

    // If no cash add-ons, return error
    if (cashAddOnCents === 0) {
      return NextResponse.json(
        { error: "No add-ons selected" },
        { status: 400 }
      );
    }

    // Check credit balance (don't deduct yet - webhook will handle it)
    if (track.ArtistProfile.reviewCredits < creditCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditCost,
          available: track.ArtistProfile.reviewCredits,
        },
        { status: 403 }
      );
    }

    // Check expert availability if requested
    if (requestExpertReviewers) {
      const genreIds = track.Genre.map((g) => g.id);

      const expertCount = await prisma.reviewerProfile.count({
        where: {
          isIndustryExpert: true,
          completedOnboarding: true,
          isRestricted: false,
          Genre: {
            some: {
              id: { in: genreIds },
            },
          },
        },
      });

      if (expertCount === 0) {
        return NextResponse.json(
          {
            error: "No industry experts available for your genres",
            suggestion:
              "Try Pro Reviewers instead, or contact support to request expert reviewers in your genre",
          },
          { status: 400 }
        );
      }
    }

    // Get or create Stripe customer
    const stripe = getStripe();
    let stripeCustomerId = track.ArtistProfile.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: track.ArtistProfile.User.email,
        metadata: {
          userId: session.user.id,
          artistProfileId: track.ArtistProfile.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.artistProfile.update({
        where: { id: track.ArtistProfile.id },
        data: { stripeCustomerId },
      });
    }

    // Build description
    const description = addOnDescriptions.join(" + ");

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Review Add-ons for "${track.title}"`,
              description: description,
            },
            unit_amount: cashAddOnCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/submit/success?trackId=${trackId}&reviews=${reviewCount}`,
      cancel_url: `${appUrl}/submit?error=canceled`,
      metadata: {
        type: "track_addons",
        trackId,
        userId: session.user.id,
        reviewCount: String(reviewCount),
        creditCost: String(creditCost),
        requestProReviewers: String(requestProReviewers),
        requestExpertReviewers: String(requestExpertReviewers),
        rushDelivery: String(rushDelivery),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating add-ons checkout:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
