import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  generateAndStoreReport,
  regenerateDeepReport,
} from "@/lib/score-report-ai";
import { notifyScoreReviewersOfNewTrack } from "@/lib/score-review";

/**
 * Idempotently mark a one-time unlock as paid.
 *
 * The single source of truth for "did this report get unlocked" is `paidAt` on
 * the row, set here. Both the Stripe webhook AND the success-redirect reconcile
 * call this, so a missed/late webhook can't leave a paying customer locked out:
 * whichever path runs first sets `paidAt`; the second no-ops.
 *
 * Returns `found: false` if the report is gone (e.g. deleted before the webhook
 * landed) so the caller can refund the orphaned charge instead of looping. Real
 * DB errors propagate (so the webhook returns non-2xx and Stripe retries).
 */
export async function markScoreUnlockPaid(
  reportId: string,
  sessionId: string | null
): Promise<{ found: boolean; newlyPaid: boolean }> {
  const existing = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { id: true, paidAt: true },
  });
  if (!existing) return { found: false, newlyPaid: false };
  if (existing.paidAt) return { found: true, newlyPaid: false };

  await prisma.trackScoreReport.update({
    where: { id: reportId },
    data: {
      paidAt: new Date(),
      status: "IN_REVIEW",
      ...(sessionId ? { stripeSessionId: sessionId } : {}),
      humanRoomSkipped: false,
    },
  });
  return { found: true, newlyPaid: true };
}

/**
 * Build/refresh everything a paid unlock owes the customer: the instant read
 * (if the report was sealed), the premium deep read, and a nudge to the reviewer
 * pool so the human room fills. Each step is independently idempotent and
 * recoverable by the delivery sweeps, so a failure here is never terminal.
 *
 * Plain async (no `after()`) so it can be awaited from a sweep or scheduled via
 * `after()` from a request handler.
 */
export async function deliverScoreUnlock(reportId: string): Promise<void> {
  try {
    await generateAndStoreReport(reportId);
  } catch (err) {
    console.error(`[score-unlock] instant read failed for ${reportId}:`, err);
  }
  await regenerateDeepReport(reportId).catch((err) =>
    console.error(`[score-unlock] deep read failed for ${reportId}:`, err)
  );
  await notifyScoreReviewersOfNewTrack(reportId).catch((err) =>
    console.error(`[score-unlock] reviewer notify failed for ${reportId}:`, err)
  );
}

/**
 * Backstop for an unlock the Stripe webhook never delivered. Verifies the stored
 * checkout session is actually paid (and belongs to this report) DIRECTLY with
 * Stripe, then unlocks idempotently and schedules delivery. Called from the
 * `?unlocked=1` success redirect (report page + /reconcile route). Returns
 * whether the report is now unlocked. Never trusts client input — payment proof
 * comes from Stripe — so it's safe to call unauthenticated.
 */
export async function reconcileScoreUnlock(
  reportId: string,
  stripeSessionId: string | null
): Promise<{ unlocked: boolean; reconciled: boolean }> {
  const report = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { id: true, paidAt: true, stripeSessionId: true },
  });
  if (!report) return { unlocked: false, reconciled: false };
  if (report.paidAt) return { unlocked: true, reconciled: false };

  const sessionId = stripeSessionId ?? report.stripeSessionId;
  if (!sessionId) return { unlocked: false, reconciled: false };

  let paid = false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    paid = session.payment_status === "paid" && session.metadata?.reportId === report.id;
  } catch (err) {
    console.error(`[score-unlock] reconcile retrieve failed for ${reportId}:`, err);
    return { unlocked: false, reconciled: false };
  }
  if (!paid) return { unlocked: false, reconciled: false };

  const { newlyPaid } = await markScoreUnlockPaid(report.id, sessionId);
  if (newlyPaid) after(() => deliverScoreUnlock(report.id));
  return { unlocked: true, reconciled: newlyPaid };
}
