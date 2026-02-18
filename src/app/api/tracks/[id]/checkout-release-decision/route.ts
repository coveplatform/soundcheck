import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PACKAGES } from "@/lib/metadata";

const requestSchema = z.object({
  paymentMethod: z.enum(["cash", "credits"]),
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
    const { paymentMethod } = requestSchema.parse(body);

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        ArtistProfile: {
          include: { User: true },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rdPackage = PACKAGES.RELEASE_DECISION;

    if (paymentMethod === "credits") {
      const CREDITS_REQUIRED = rdPackage.creditsRequired;

      // Check credit balance
      if (track.ArtistProfile.reviewCredits < CREDITS_REQUIRED) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            required: CREDITS_REQUIRED,
            available: track.ArtistProfile.reviewCredits,
          },
          { status: 403 }
        );
      }

      // Deduct credits and update track
      await prisma.$transaction(async (tx) => {
        await tx.artistProfile.update({
          where: { id: track.artistId },
          data: {
            reviewCredits: { decrement: CREDITS_REQUIRED },
            totalCreditsSpent: { increment: CREDITS_REQUIRED },
          },
        });

        await tx.track.update({
          where: { id: trackId },
          data: {
            packageType: "RELEASE_DECISION",
            reviewsRequested: rdPackage.reviews,
            creditsSpent: CREDITS_REQUIRED,
            status: "QUEUED",
            paidAt: new Date(),
          },
        });
      });

      // Assign expert reviewers (imported from queue.ts)
      const { assignExpertReviewersToTrack } = await import("@/lib/queue");
      await assignExpertReviewersToTrack(trackId);

      return NextResponse.json({
        success: true,
        paymentMethod: "credits",
      });
    } else {
      // Cash payment via Stripe
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

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Release Decision for "${track.title}"`,
                description: rdPackage.description,
              },
              unit_amount: rdPackage.price, // 3900 cents = $39
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/submit/success?trackId=${trackId}&releaseDecision=true`,
        cancel_url: `${appUrl}/submit?error=canceled`,
        metadata: {
          type: "release_decision",
          trackId,
          userId: session.user.id,
          reviewCount: String(rdPackage.reviews),
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    }
  } catch (error) {
    console.error("Error creating Release Decision checkout:", error);

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
