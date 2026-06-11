import { prisma } from "@/lib/prisma";
import { regenerateDeepReport } from "@/lib/score-report-ai";
import { ADMIN_EMAIL, emailWrapper, getAppUrl, sendEmail } from "@/lib/email";

/**
 * Watchdogs for the score-report pipeline, run from the cron route.
 *
 * Both exist because the happy path is fire-and-forget: the deep read rides
 * `after()` callbacks that a serverless kill can eat silently, and the human
 * room is pull-based with nothing watching whether anyone actually pulls.
 */

// regenerateDeepReport runs full deep DSP (Replicate stems) + a big LLM call —
// minutes each. Cap the work per sweep so the cron invocation finishes inside
// its own maxDuration; the backlog (if any) drains across runs.
const DEEP_SWEEP_LIMIT = 2;
const DEEP_SWEEP_TIME_BUDGET_MS = 200_000;

// Don't sweep a report the moment it's paid — the legitimate after() hooks get
// a generous head start before we conclude they died.
const DEEP_GRACE_MS = 15 * 60 * 1000;

/**
 * Re-fire the premium deep read for paid reports where it never landed
 * (`paidAt` set, instant read done, but `reviewerQuotes.deep` absent). Without
 * this, a Replicate cold start blowing the function budget means the buyer
 * silently keeps the teaser-grade prose forever.
 */
export async function sweepMissingDeepReads() {
  const cutoff = new Date(Date.now() - DEEP_GRACE_MS);
  const candidates = await prisma.trackScoreReport.findMany({
    where: {
      paidAt: { not: null, lt: cutoff },
      score: { not: null },
    },
    orderBy: { paidAt: "asc" },
    take: 50,
    select: { id: true, slug: true, reviewerQuotes: true },
  });

  const missing = candidates.filter((r) => {
    const q = (r.reviewerQuotes ?? {}) as Record<string, unknown>;
    return !q.deep && !q.invalid;
  });

  const started = Date.now();
  let repaired = 0;
  const attempted: string[] = [];
  for (const r of missing.slice(0, DEEP_SWEEP_LIMIT)) {
    if (Date.now() - started > DEEP_SWEEP_TIME_BUDGET_MS) break;
    attempted.push(r.slug);
    try {
      await regenerateDeepReport(r.id);
      repaired++;
    } catch (err) {
      console.error(`[score-sweep] deep re-read failed for ${r.slug}:`, err);
    }
  }

  if (missing.length > 0) {
    console.log(
      `[score-sweep] deep reads missing on ${missing.length} paid report(s); repaired ${repaired} this run (${attempted.join(", ")})`
    );
  }
  return { missing: missing.length, repaired, attempted };
}

// A paid room that hasn't filled in this long is a broken promise, not a queue.
const ROOM_STALL_MS = 48 * 60 * 60 * 1000;

/**
 * Alert admin (once per report) when a paid report's human room is still
 * incomplete after 48h. The room is pull-based — if the reviewer pool goes
 * quiet, paid reports sit IN_REVIEW indefinitely with nothing watching.
 */
export async function alertStuckPaidRooms() {
  const cutoff = new Date(Date.now() - ROOM_STALL_MS);
  const reports = await prisma.trackScoreReport.findMany({
    where: {
      paidAt: { not: null, lt: cutoff },
      humanRoomSkipped: false,
      status: { not: "COMPLETED" },
    },
    orderBy: { paidAt: "asc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      trackTitle: true,
      email: true,
      paidAt: true,
      humanReviewsRequested: true,
      reviewerQuotes: true,
      _count: { select: { ScoreReview: { where: { status: "COMPLETED" } } } },
    },
  });

  const stuck = reports.filter((r) => {
    const q = (r.reviewerQuotes ?? {}) as Record<string, unknown>;
    return (
      r._count.ScoreReview < r.humanReviewsRequested &&
      !q.invalid &&
      !q.roomStallAlertedAt
    );
  });
  if (stuck.length === 0) return { alerted: 0 };

  const rows = stuck
    .map((r) => {
      const days = r.paidAt
        ? Math.floor((Date.now() - r.paidAt.getTime()) / (24 * 60 * 60 * 1000))
        : 0;
      return `<li style="margin-bottom: 8px;">
        <a href="${getAppUrl()}/report/${r.slug}" style="font-weight: 700;">${r.trackTitle || "untitled"}</a>
        — ${r.email} — ${r._count.ScoreReview}/${r.humanReviewsRequested} reviews in, paid ${days}d ago
      </li>`;
    })
    .join("");
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700;">Paid rooms stuck past 48h</h1>
    <p style="margin: 0 0 16px;">These paid reports still don't have their full room of reviewers. The queue is pull-based — if the pool isn't pulling, these sit forever:</p>
    <ul style="padding-left: 20px;">${rows}</ul>
  `;

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `⚠️ ${stuck.length} paid room${stuck.length === 1 ? "" : "s"} stuck past 48h`,
      html: emailWrapper(content),
    });
  } catch (err) {
    // Don't mark alerted if the email never went out.
    console.error("[score-sweep] stuck-room alert email failed:", err);
    return { alerted: 0, stuck: stuck.length };
  }

  // Mark each report alerted (jsonb_set — never clobber the rest of the
  // quotes blob, which holds the live report content).
  const alertedAt = new Date().toISOString();
  for (const r of stuck) {
    await prisma
      .$executeRaw`UPDATE "TrackScoreReport" SET "reviewerQuotes" = jsonb_set(COALESCE("reviewerQuotes", '{}'::jsonb), '{roomStallAlertedAt}', to_jsonb(${alertedAt}::text)) WHERE id = ${r.id}`
      .catch((err) => console.error(`[score-sweep] failed to mark ${r.slug} alerted:`, err));
  }
  return { alerted: stuck.length };
}
