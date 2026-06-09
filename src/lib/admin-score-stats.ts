import { prisma } from "@/lib/prisma";
import { UNLOCK_PRICE_CENTS } from "@/lib/score-subscription";

/**
 * Admin-side aggregation for the score-report product.
 *
 * Tier and report data are keyed by *email* (submissions are email-first), not by
 * a Prisma relation, so callers enrich their user rows in JS after the user query.
 */

export type Tier = "Unlimited" | "One-time" | "Free";

export type ScoreStats = {
  tier: Tier;
  subStatus: string | null; // active | canceled | past_due | inactive | null
  subActive: boolean;
  renewsAt: Date | null;
  reports: number;
  paidReports: number;
  lastReportAt: Date | null;
  spendCents: number; // approximate one-time spend (paidReports * unlock price)
};

function norm(email: string): string {
  return email.trim().toLowerCase();
}

export function computeTier(subActive: boolean, paidReports: number): Tier {
  if (subActive) return "Unlimited";
  if (paidReports > 0) return "One-time";
  return "Free";
}

/** One-time spend is approximate — paid reports × the fixed unlock price. */
export function estimatedSpendCents(paidReports: number): number {
  return paidReports * UNLOCK_PRICE_CENTS;
}

/** Empty stats for an email we have no score data on. */
function emptyStats(): ScoreStats {
  return {
    tier: "Free",
    subStatus: null,
    subActive: false,
    renewsAt: null,
    reports: 0,
    paidReports: 0,
    lastReportAt: null,
    spendCents: 0,
  };
}

/**
 * Score stats for a batch of emails — one subscriber query + one report query,
 * reduced in JS. Returns a Map keyed by lowercased email. Emails with no data
 * are present with zeroed/Free stats.
 */
export async function getScoreStatsForEmails(emails: string[]): Promise<Map<string, ScoreStats>> {
  const normed = Array.from(new Set(emails.map(norm).filter(Boolean)));
  const out = new Map<string, ScoreStats>();
  for (const e of normed) out.set(e, emptyStats());
  if (normed.length === 0) return out;

  const [subs, reports] = await Promise.all([
    prisma.scoreSubscriber.findMany({
      where: { email: { in: normed } },
      select: { email: true, status: true, currentPeriodEnd: true },
    }),
    prisma.trackScoreReport.findMany({
      where: { email: { in: normed, mode: "insensitive" } },
      select: { email: true, paidAt: true, createdAt: true },
    }),
  ]);

  for (const r of reports) {
    const key = norm(r.email);
    const s = out.get(key);
    if (!s) continue;
    s.reports += 1;
    if (r.paidAt) s.paidReports += 1;
    if (!s.lastReportAt || r.createdAt > s.lastReportAt) s.lastReportAt = r.createdAt;
  }

  for (const sub of subs) {
    const key = norm(sub.email);
    const s = out.get(key);
    if (!s) continue;
    s.subStatus = sub.status;
    s.subActive = sub.status === "active";
    s.renewsAt = sub.currentPeriodEnd;
  }

  for (const s of out.values()) {
    s.tier = computeTier(s.subActive, s.paidReports);
    s.spendCents = estimatedSpendCents(s.paidReports);
  }

  return out;
}
