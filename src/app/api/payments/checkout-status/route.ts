import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { sendTrackQueuedEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { finalizePaidCheckoutSession } from "@/lib/payments";

type CheckoutStatus = "PENDING" | "COMPLETED" | "FAILED";

async function finalizeIfPaid(params: {
  stripeSessionId: string;
  trackId: string;
}) {
  const stripe = getStripe();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(params.stripeSessionId);
  } catch {
    return null;
  }

  if (!session) return null;

  const sessionStatus = session.status;
  const paymentStatus = session.payment_status;

  if (sessionStatus === "expired") {
    await prisma.payment.updateMany({
      where: { stripeSessionId: params.stripeSessionId, status: "PENDING" },
      data: { status: "FAILED" },
    });

    return { status: "FAILED" as const };
  }

  if (paymentStatus !== "paid") {
    return { status: "PENDING" as const };
  }

  const completedAt = new Date();

  const result = await finalizePaidCheckoutSession({
    stripeSessionId: params.stripeSessionId,
    trackId: params.trackId,
    stripePaymentId: (session.payment_intent as string) || null,
    amountTotalCents: typeof session.amount_total === "number" ? session.amount_total : null,
    completedAt,
  });

  await assignReviewersToTrack(result.trackId);

  if (result.queuedNow && result.artistEmail && result.trackTitle) {
    await sendTrackQueuedEmail(result.artistEmail, result.trackTitle);
  }

  return { status: "COMPLETED" as const };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stripeSessionId =
    searchParams.get("session_id") || searchParams.get("sessionId");

  if (!stripeSessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  // Handle bypass_ and free_credit_ prefixes (no Stripe lookup needed)
  const specialPrefixes = ["bypass_", "free_credit_"] as const;
  const matchedPrefix = specialPrefixes.find((p) => stripeSessionId.startsWith(p));

  if (matchedPrefix) {
    const trackId = stripeSessionId.slice(matchedPrefix.length);

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true, payment: true },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const status: CheckoutStatus =
      track.status !== "PENDING_PAYMENT" ? "COMPLETED" : "PENDING";

    return NextResponse.json({
      status,
      trackId: track.id,
      trackTitle: track.title,
      trackStatus: track.status,
      paymentStatus: track.payment?.status ?? null,
      amount: track.payment?.amount ?? null,
      packageType: track.packageType,
    });
  }

  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId },
    include: {
      track: {
        include: { artist: { include: { user: true } } },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.track.artist.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let status: CheckoutStatus =
    payment.status === "COMPLETED" || payment.track.status !== "PENDING_PAYMENT"
      ? "COMPLETED"
      : payment.status === "FAILED"
        ? "FAILED"
        : "PENDING";

  if (status === "PENDING") {
    try {
      const finalized = await finalizeIfPaid({
        stripeSessionId,
        trackId: payment.trackId,
      });
      if (finalized?.status) {
        status = finalized.status;
      }
    } catch {
    }
  }

  const refreshedTrack = await prisma.track.findUnique({
    where: { id: payment.trackId },
    include: { payment: true },
  });

  return NextResponse.json({
    status,
    trackId: payment.trackId,
    trackTitle: payment.track.title,
    trackStatus: refreshedTrack?.status ?? payment.track.status,
    paymentStatus: refreshedTrack?.payment?.status ?? payment.status,
    amount: refreshedTrack?.payment?.amount ?? payment.amount,
    packageType: payment.track.packageType,
  });
}
