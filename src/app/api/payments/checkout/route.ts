import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripePlatformDefaults } from "@/lib/stripe";
import { PACKAGES, PackageType } from "@/lib/metadata";

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
        { error: "Please verify your email to continue" },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    const defaults = await getStripePlatformDefaults();
    const currency = (process.env.STRIPE_CURRENCY ?? defaults.currency).toLowerCase();

    const { trackId } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 });
    }

    const stripe = getStripe();

    // Get track
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: {
          include: { user: true },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Verify ownership
    if (track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already paid
    if (track.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Track already submitted for review" },
        { status: 400 }
      );
    }

    // Get package details
    const packageDetails = PACKAGES[track.packageType as PackageType];
    if (!packageDetails) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: track.artist.user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `SoundCheck ${packageDetails.name} Package`,
              description: `${packageDetails.reviews} reviews for "${track.title}"`,
            },
            unit_amount: packageDetails.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        trackId: track.id,
        packageType: track.packageType,
        userId: session.user.id,
      },
      success_url: `${baseUrl}/artist/submit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/artist/submit?trackId=${track.id}`,
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
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
