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

    if (track.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Track payment already completed or not eligible" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const packageDetails = PACKAGES[track.packageType];

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
              name: `${packageDetails.name} Package`,
              description: `${packageDetails.Review} reviews for: ${track.title}`,
            },
            unit_amount: packageDetails.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/artist/submit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/artist/submit?canceled=true`,
      metadata: {
        trackId: track.id,
        userId: session.user.id,
        artistProfileId: track.ArtistProfile.id,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        trackId: track.id,
        amount: packageDetails.price,
        stripeSessionId: checkoutSession.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Track checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
