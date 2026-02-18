import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PACKAGES } from "@/lib/metadata";

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

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        ArtistProfile: {
          select: {
            id: true,
            userId: true,
            stripeCustomerId: true,
            User: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent upgrading if already Release Decision
    if (track.packageType === "RELEASE_DECISION") {
      return NextResponse.json(
        { error: "Track is already a Release Decision package" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const rdPackage = PACKAGES.RELEASE_DECISION;

    // Create or get customer
    let customerId = track.ArtistProfile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: track.ArtistProfile.User.email,
        name: track.ArtistProfile.User.name || undefined,
        metadata: {
          userId: session.user.id,
          artistProfileId: track.ArtistProfile.id,
        },
      });
      customerId = customer.id;
      await prisma.artistProfile.update({
        where: { id: track.ArtistProfile.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Release Decision: "${track.title}"`,
              description: rdPackage.description,
            },
            unit_amount: rdPackage.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/artist/tracks/${trackId}?upgraded=true`,
      cancel_url: `${appUrl}/artist/tracks/${trackId}?canceled=true`,
      metadata: {
        type: "release_decision",
        trackId: track.id,
        userId: session.user.id,
        reviewCount: String(rdPackage.reviews),
        isUpgrade: "true",
      },
    });

    // Redirect to Stripe checkout (303 forces GET after POST)
    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (error) {
    console.error("Release Decision upgrade error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
