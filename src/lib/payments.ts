import { prisma } from "@/lib/prisma";

export async function finalizePaidCheckoutSession(params: {
  stripeSessionId: string;
  trackId: string;
  stripePaymentId: string | null;
  amountTotalCents: number | null;
  completedAt: Date;
}): Promise<{
  trackId: string;
  queuedNow: boolean;
  artistEmail: string | null;
  trackTitle: string | null;
}> {
  return prisma.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({
      where: { stripeSessionId: params.stripeSessionId },
      select: { id: true, trackId: true, status: true },
    });

    if (existingPayment && existingPayment.trackId !== params.trackId) {
      throw new Error(
        `Stripe session ${params.stripeSessionId} does not belong to track ${params.trackId}`
      );
    }

    if (existingPayment && existingPayment.status === "REFUNDED") {
      return {
        trackId: existingPayment.trackId,
        queuedNow: false,
        artistEmail: null,
        trackTitle: null,
      };
    }

    if (existingPayment) {
      await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "COMPLETED",
          stripePaymentId: params.stripePaymentId,
          completedAt: params.completedAt,
        },
      });
    } else {
      try {
        await tx.payment.create({
          data: {
            trackId: params.trackId,
            amount: params.amountTotalCents ?? 0,
            stripeSessionId: params.stripeSessionId,
            stripePaymentId: params.stripePaymentId,
            status: "COMPLETED",
            completedAt: params.completedAt,
          },
        });
      } catch {}
    }

    const track = await tx.track.findUnique({
      where: { id: params.trackId },
      select: {
        id: true,
        title: true,
        status: true,
        paidAt: true,
        artistId: true,
        Payment: { select: { amount: true, stripeSessionId: true } },
        ArtistProfile: { select: { User: { select: { email: true } } } },
      },
    });

    if (!track) {
      return {
        trackId: params.trackId,
        queuedNow: false,
        artistEmail: null,
        trackTitle: null,
      };
    }

    if (track.Payment && track.Payment.stripeSessionId !== params.stripeSessionId) {
      throw new Error(
        `Track ${params.trackId} payment session mismatch (${track.Payment.stripeSessionId} !== ${params.stripeSessionId})`
      );
    }

    const firstQueue = await tx.track.updateMany({
      where: {
        id: track.id,
        paidAt: null,
        status: "PENDING_PAYMENT",
      },
      data: {
        status: "QUEUED",
        paidAt: params.completedAt,
      },
    });

    if (firstQueue.count > 0) {
      const amountSpent = params.amountTotalCents ?? track.Payment?.amount ?? 0;

      await tx.artistProfile.update({
        where: { id: track.artistId },
        data: {
          totalTracks: { increment: 1 },
          totalSpent: { increment: amountSpent },
        },
      });
    }

    return {
      trackId: track.id,
      queuedNow: firstQueue.count > 0,
      artistEmail: track.ArtistProfile.User?.email ?? null,
      trackTitle: track.title ?? null,
    };
  });
}
