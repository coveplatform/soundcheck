import { prisma } from "@/lib/prisma";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { FREE_FULL_READ, FREE_READS_LIFETIME } from "@/lib/score-free-tier";

/** Valid = counts toward the free read: pending (will complete) or scored.
    Invalid reads (dead link / too long / too short land as score 0) don't. */
const VALID_READ = { OR: [{ score: null }, { score: { gt: 0 } }] };

/**
 * Has this email already used its lifetime free full read? Only meaningful
 * once the open-read model is live (FREE_FULL_READ); subscribers never count
 * as capped (their reports auto-unlock anyway).
 *
 * Used by /submit and /claim to flag the response (the client shows the
 * sealed-report upsell) — submissions are never blocked; over-cap tracks
 * generate normally and render sealed, which is rung 2 of the ladder.
 */
export async function freeReadUsed(email: string): Promise<boolean> {
  if (!FREE_FULL_READ || !email) return false;
  if (await isScoreSubscribed(email)) return false;
  const used = await prisma.trackScoreReport.count({
    where: { email, ...VALID_READ },
  });
  return used >= FREE_READS_LIFETIME;
}

/**
 * Render-time openness for an unpaid report: it's the free read iff it is the
 * email's EARLIEST valid report. Deterministic forever — a user's first track
 * stays open, every later one renders sealed until unlocked. Unclaimed
 * reports (no email yet) stay sealed; they resolve on claim.
 */
export async function isFreeOpenRead(report: {
  id: string;
  email: string;
}): Promise<boolean> {
  if (!FREE_FULL_READ || !report.email) return false;
  const first = await prisma.trackScoreReport.findFirst({
    where: { email: report.email, ...VALID_READ },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id === report.id;
}
