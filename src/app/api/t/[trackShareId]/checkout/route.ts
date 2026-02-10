import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  buyerEmail: z.string().email(),
  buyerName: z.string().min(1).optional(),
  affiliateCode: z.string().optional(),
});

/**
 * POST /api/t/[trackShareId]/checkout
 * Create Stripe checkout session for external track purchase
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ trackShareId: string }> }
) {
  try {
    const { trackShareId } = await context.params;
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // Fetch track
    const track = await prisma.track.findUnique({
      where: { trackShareId },
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        sourceType: true,
        sharingEnabled: true,
        sharingMode: true,
        salePrice: true,
        ArtistProfile: {
          select: {
            id: true,
            artistName: true,
            userId: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Validate track is for sale
    if (!track.sharingEnabled || track.sharingMode !== "SALES") {
      return NextResponse.json(
        { error: "This track is not available for purchase" },
        { status: 400 }
      );
    }

    if (!track.salePrice) {
      return NextResponse.json(
        { error: "Track price not configured" },
        { status: 400 }
      );
    }

    // Validate source type
    if (track.sourceType !== "UPLOAD") {
      return NextResponse.json(
        { error: "Only uploaded tracks can be purchased" },
        { status: 400 }
      );
    }

    // Validate affiliate code if provided
    let affiliateLink = null;
    if (data.affiliateCode) {
      affiliateLink = await prisma.trackAffiliateLink.findUnique({
        where: { code: data.affiliateCode },
        select: {
          id: true,
          code: true,
          createdByUserId: true,
          isActive: true,
        },
      });

      if (!affiliateLink || !affiliateLink.isActive) {
        console.warn(`Invalid or inactive affiliate code: ${data.affiliateCode}`);
        // Don't fail the checkout, just ignore the affiliate code
        affiliateLink = null;
      }
    }

    // Calculate revenue split
    const totalAmount = track.salePrice; // cents
    const platformFeePercent = track.ArtistProfile.subscriptionStatus === "active" ? 0.15 : 0.20; // Pro: 15%, Free: 20%
    const affiliateCommissionPercent = 0.10; // 10%

    const platformFee = Math.round(totalAmount * platformFeePercent);
    const affiliateCommission = affiliateLink ? Math.round(totalAmount * affiliateCommissionPercent) : 0;
    const artistAmount = totalAmount - platformFee - affiliateCommission;

    // Create pending purchase record
    const purchase = await prisma.externalPurchase.create({
      data: {
        trackId: track.id,
        buyerEmail: data.buyerEmail,
        buyerName: data.buyerName,
        amount: totalAmount,
        platformFee,
        affiliateCommission,
        artistAmount,
        affiliateCode: affiliateLink?.code,
        affiliateUserId: affiliateLink?.createdByUserId,
        status: "PENDING",
        stripePaymentIntentId: "pending", // Will be updated by webhook
      },
    });

    // Create Stripe checkout session
    const stripe = getStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd", // Could be made dynamic based on account settings
            product_data: {
              name: track.title,
              description: `Digital download by ${track.ArtistProfile.artistName}`,
              metadata: {
                trackId: track.id,
                trackShareId,
                artistName: track.ArtistProfile.artistName,
              },
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${trackShareId}?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${trackShareId}?canceled=true`,
      metadata: {
        purchaseId: purchase.id,
        trackId: track.id,
        trackShareId,
        buyerEmail: data.buyerEmail,
        artistId: track.ArtistProfile.id,
        affiliateCode: affiliateLink?.code || "",
        affiliateUserId: affiliateLink?.createdByUserId || "",
      },
    });

    // Update purchase with checkout session ID
    await prisma.externalPurchase.update({
      where: { id: purchase.id },
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      purchaseId: purchase.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
