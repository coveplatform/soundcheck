import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  isScoreSubscribed,
  scoreSubPrice,
  UNLOCK_PRICE_CENTS,
} from "@/lib/score-subscription";
import { isSupportedTrackUrl, isPrivateSoundcloudUrl, normalizeTrackUrl, PRIVATE_SOUNDCLOUD_REASON } from "@/lib/track-url";
import { resolveShortUrl } from "@/lib/metadata";
import { ensureArtistProfile } from "@/lib/ensure-artist-profile";

/**
 * Pay-to-continue checkout for an artist past their lifetime free read.
 *
 * The hard free-tier wall: nothing is generated (and no report row exists) until
 * the artist commits to paying. This endpoint is hit by the wall's buttons — it
 * creates the report SEALED (no AI read kicked) and opens either the one-time
 * unlock ($6.95) or the unlimited subscription checkout. Generation fires from
 * the Stripe webhook once payment lands, so people who bounce at the wall (or at
 * Stripe) never cost a read.
 *
 * The SEALED marker lives in `reviewerQuotes.sealed` (no enum migration): the
 * report page renders the wall for it, /generate refuses to auto-run it, and the
 * flag self-clears when generation's final write replaces reviewerQuotes.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { trackUrl, trackTitle, genre, notes, plan } = (body ?? {}) as {
      trackUrl?: string;
      trackTitle?: string;
      genre?: string;
      notes?: string;
      plan?: "unlock" | "monthly" | "annual";
    };

    if (!trackUrl?.trim()) {
      return NextResponse.json({ error: "A track link is required." }, { status: 400 });
    }
    if (!isSupportedTrackUrl(trackUrl)) {
      return NextResponse.json(
        { error: "We can't read that link. Paste a SoundCloud, YouTube, Bandcamp or direct MP3 link." },
        { status: 400 }
      );
    }

    const isSub = plan === "monthly" || plan === "annual";

    // Already unlimited: they shouldn't see the wall — let the client fall back
    // to the normal submit flow instead of charging again.
    if (isSub && (await isScoreSubscribed(email))) {
      return NextResponse.json({ alreadySubscribed: true });
    }

    const normalizedTrackUrl = await resolveShortUrl(normalizeTrackUrl(trackUrl));

    // Private share shortlinks only reveal their /s-<token> after expansion —
    // reject before taking payment for a track reviewers can't play.
    if (isPrivateSoundcloudUrl(normalizedTrackUrl)) {
      return NextResponse.json({ error: PRIVATE_SOUNDCLOUD_REASON }, { status: 400 });
    }

    const userId = session?.user?.id;
    const artistId = userId ? await ensureArtistProfile(userId) : null;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Reuse an existing unpaid SEALED row for the same track if there is one —
    // a bounced/retried checkout shouldn't leave a trail of junk rows. (Any
    // unpaid, unscored row for this email+track is a prior abandoned wall.)
    const existing = await prisma.trackScoreReport.findFirst({
      where: {
        email,
        trackUrl: normalizedTrackUrl,
        paidAt: null,
        score: null,
        // Only reuse a prior WALL row — never a first report mid-generation.
        reviewerQuotes: { path: ["sealed"], equals: true },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true },
    });

    // Create the report SEALED — no generation. The webhook builds the read on
    // payment; until then the report page renders the pay-to-continue wall.
    const report =
      existing ??
      (await prisma.trackScoreReport.create({
        data: {
          email,
          trackUrl: normalizedTrackUrl,
          trackTitle: trackTitle?.trim() || null,
          genre: genre?.trim() || "Other",
          notes: notes?.trim() || null,
          artistId,
          status: "PENDING",
          createdByIp: ip,
          reviewerQuotes: { sealed: true },
        },
        select: { id: true, slug: true },
      }));

    const stripe = getStripe();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    if (isSub) {
      const planKey = plan === "annual" ? "annual" : "monthly";
      const price = scoreSubPrice(planKey);
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "MixReflect — Unlimited",
                description: "Unlimited full report unlocks while subscribed.",
              },
              unit_amount: price.amount,
              recurring: { interval: price.interval },
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/report/${report.slug}?subscribed=1&plan=${planKey}`,
        cancel_url: `${appUrl}/report/${report.slug}`,
        // fromReport: the webhook builds THIS track's read + room (the backlog
        // back-unlock skips rooms for the rest).
        metadata: { type: "score_subscription", email, fromReport: report.slug },
        subscription_data: {
          metadata: { type: "score_subscription", email },
        },
      });
      return NextResponse.json({ url: checkoutSession.url, slug: report.slug });
    }

    // One-time unlock ($6.95).
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MixReflect — Full Report Unlock",
              description: trackTitle?.trim()
                ? `Unlock the full room read for "${trackTitle.trim()}"`
                : "Unlock your full room read",
            },
            unit_amount: UNLOCK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/report/${report.slug}?unlocked=1`,
      cancel_url: `${appUrl}/report/${report.slug}`,
      metadata: {
        type: "score_unlock",
        reportId: report.id,
        reportSlug: report.slug,
      },
    });

    await prisma.trackScoreReport.update({
      where: { id: report.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url, slug: report.slug });
  } catch (error) {
    console.error("Score sealed-checkout error:", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
