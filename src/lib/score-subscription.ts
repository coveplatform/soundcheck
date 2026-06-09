import { prisma } from "@/lib/prisma";

/**
 * "Unlimited unlocks" subscription for the score product, keyed by email
 * (submissions are email-first, so subscribers don't need a full account).
 *
 * Mechanism: while a subscriber is active, every report they submit is
 * auto-unlocked (its `paidAt` is set), so the entire existing gate + shared-link
 * behaviour works unchanged. Unlocked reports stay readable after cancellation;
 * only new ones re-gate.
 */

const SUB_MONTHLY_CENTS = 1995; // $19.95 / month
const SUB_ANNUAL_CENTS = 14340; // $143.40 / year (= $11.95/mo, ~40% off monthly)

/** One-time price to unlock a single report's full results. */
export const UNLOCK_PRICE_CENTS = 695; // $6.95 one-time

export type SubPlan = "monthly" | "annual";

export function scoreSubPrice(plan: SubPlan): {
  amount: number;
  interval: "month" | "year";
} {
  return plan === "annual"
    ? { amount: SUB_ANNUAL_CENTS, interval: "year" }
    : { amount: SUB_MONTHLY_CENTS, interval: "month" };
}

function norm(email: string): string {
  return email.trim().toLowerCase();
}

/** Is this email an active unlimited subscriber? */
export async function isScoreSubscribed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const sub = await prisma.scoreSubscriber.findUnique({
    where: { email: norm(email) },
    select: { status: true },
  });
  return sub?.status === "active";
}

/**
 * Unlock every still-gated report for this email (e.g. right after they subscribe).
 * These past free submissions become readable in full (AI read), but we don't
 * retroactively hand each one a real room: humanRoomSkipped keeps them out of the
 * reviewer claim pool and the monthly round count. Go-forward submissions earn
 * rooms within the cap as normal.
 */
export async function unlockAllForEmail(email: string): Promise<number> {
  const res = await prisma.trackScoreReport.updateMany({
    where: { email: norm(email), paidAt: null },
    data: { paidAt: new Date(), humanRoomSkipped: true },
  });
  return res.count;
}

/** Mark a subscriber active (on checkout completion) + back-unlock their reports. */
export async function activateSubscriber(args: {
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  const email = norm(args.email);
  await prisma.scoreSubscriber.upsert({
    where: { email },
    create: {
      email,
      status: "active",
      stripeCustomerId: args.stripeCustomerId ?? null,
      stripeSubscriptionId: args.stripeSubscriptionId ?? null,
      currentPeriodEnd: args.currentPeriodEnd ?? null,
    },
    update: {
      status: "active",
      stripeCustomerId: args.stripeCustomerId ?? undefined,
      stripeSubscriptionId: args.stripeSubscriptionId ?? undefined,
      currentPeriodEnd: args.currentPeriodEnd ?? undefined,
    },
  });
  await unlockAllForEmail(email);
}

/** Update a subscriber's status from a Stripe subscription event. */
export async function updateSubscriberStatus(args: {
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  status: string;
  currentPeriodEnd?: Date | null;
}): Promise<boolean> {
  const where = args.stripeSubscriptionId
    ? { stripeSubscriptionId: args.stripeSubscriptionId }
    : args.stripeCustomerId
      ? { stripeCustomerId: args.stripeCustomerId }
      : null;
  if (!where) return false;

  const existing = await prisma.scoreSubscriber.findFirst({ where, select: { id: true } });
  if (!existing) return false;

  await prisma.scoreSubscriber.update({
    where: { id: existing.id },
    data: {
      status: args.status,
      ...(args.currentPeriodEnd ? { currentPeriodEnd: args.currentPeriodEnd } : {}),
    },
  });
  return true;
}
