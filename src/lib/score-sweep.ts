import { prisma } from "@/lib/prisma";
import { regenerateDeepReport, generateAndStoreReport } from "@/lib/score-report-ai";
import { ADMIN_EMAIL, emailWrapper, getAppUrl, sendEmail } from "@/lib/email";

/**
 * Watchdogs for the score-report pipeline, run from the cron route.
 *
 * Both exist because the happy path is fire-and-forget: the deep read rides
 * `after()` callbacks that a serverless kill can eat silently, and the human
 * room is pull-based with nothing watching whether anyone actually pulls.
 */

// regenerateDeepReport runs full deep DSP (Replicate stems) + a big LLM call —
// minutes each. Run ONE per invocation so it gets the whole function budget
// (a cold-start deep read can approach the maxDuration ceiling); the backlog
// drains across the dedicated, frequent deep-read cron rather than one slow
// daily pass.
const DEEP_SWEEP_LIMIT = 1;
const DEEP_SWEEP_TIME_BUDGET_MS = 280_000;

// Don't sweep a report the moment it's paid — the legitimate after() hooks get
// a generous head start before we conclude they died.
const DEEP_GRACE_MS = 15 * 60 * 1000;

// After a failed attempt, let a report cool down before retrying it, so a
// repeatedly-failing record yields its slot to never-tried ones instead of
// pinning the head of the queue (the head-of-line starvation bug).
const DEEP_RETRY_COOLDOWN_MS = 30 * 60 * 1000;

/**
 * Re-fire the premium deep read for paid reports where it never landed
 * (`paidAt` set, instant read done, but `reviewerQuotes.deep` absent). Without
 * this, a Replicate cold start blowing the function budget means the buyer
 * silently keeps the teaser-grade prose forever.
 *
 * Starvation-safe: terminally-failed reports (`deepFailed`, set by
 * regenerateDeepReport after MAX_DEEP_ATTEMPTS) are skipped, recently-attempted
 * ones cool down, and never-attempted reports are ordered first — so one
 * poisoned record can't block everyone behind it.
 */
export async function sweepMissingDeepReads() {
  const cutoff = new Date(Date.now() - DEEP_GRACE_MS);
  const candidates = await prisma.trackScoreReport.findMany({
    where: {
      paidAt: { not: null, lt: cutoff },
      score: { not: null },
    },
    orderBy: { paidAt: "asc" },
    take: 200,
    select: { id: true, slug: true, paidAt: true, reviewerQuotes: true },
  });

  const now = Date.now();
  const missing = candidates.filter((r) => {
    const q = (r.reviewerQuotes ?? {}) as Record<string, unknown>;
    if (q.deep || q.invalid || q.deepFailed) return false;
    // Cooling down after a recent attempt? Skip this run; let others go first.
    const last = typeof q.deepLastAttemptAt === "string" ? Date.parse(q.deepLastAttemptAt) : NaN;
    if (Number.isFinite(last) && now - last < DEEP_RETRY_COOLDOWN_MS) return false;
    return true;
  });

  // Never-attempted first, then least-recently-attempted — a failing record
  // sinks to the back each round so forward progress is guaranteed.
  missing.sort((a, b) => {
    const qa = (a.reviewerQuotes ?? {}) as Record<string, unknown>;
    const qb = (b.reviewerQuotes ?? {}) as Record<string, unknown>;
    const la = typeof qa.deepLastAttemptAt === "string" ? Date.parse(qa.deepLastAttemptAt) : 0;
    const lb = typeof qb.deepLastAttemptAt === "string" ? Date.parse(qb.deepLastAttemptAt) : 0;
    return la - lb;
  });

  const started = Date.now();
  let repaired = 0;
  let failed = 0;
  const attempted: string[] = [];
  for (const r of missing.slice(0, DEEP_SWEEP_LIMIT)) {
    if (Date.now() - started > DEEP_SWEEP_TIME_BUDGET_MS) break;
    attempted.push(r.slug);
    try {
      await regenerateDeepReport(r.id);
      repaired++;
    } catch (err) {
      failed++;
      console.error(`[score-sweep] deep re-read failed for ${r.slug}:`, err);
    }
  }

  // Surface reports we've now given up on, once, so they don't vanish silently.
  const nowFailed = await prisma.trackScoreReport.count({
    where: { paidAt: { not: null }, reviewerQuotes: { path: ["deepFailed"], equals: true } },
  });

  if (missing.length > 0 || nowFailed > 0) {
    console.log(
      `[score-sweep] deep reads missing on ${missing.length} paid report(s); repaired ${repaired}, failed ${failed} this run (${attempted.join(", ")}); ${nowFailed} terminally failed`
    );
  }
  return { missing: missing.length, repaired, failed, terminallyFailed: nowFailed, attempted };
}

// A paid/owned report whose generation died leaves score=null with nothing to
// heal it once the user closes the pending page. Give the legitimate in-flight
// run a grace window, then rebuild it server-side.
const INSTANT_GRACE_MS = 10 * 60 * 1000;
const INSTANT_SWEEP_LIMIT = 3;

/**
 * Re-fire the INSTANT read for paid or claimed reports stuck at score=null —
 * generation rides `after()` and a serverless kill can eat it silently. The
 * deep-read sweep filters `score: { not: null }`, so without this a PAID sealed
 * report (or a signed-in user's report) whose generation died sits blank
 * forever once they leave the pending page (the client poll is the only other
 * recovery). generateAndStoreReport self-guards (atomic claim, no-op if already
 * scored or live), so this is safe to fire alongside any in-flight run.
 */
export async function sweepMissingInstantReads() {
  const cutoff = new Date(Date.now() - INSTANT_GRACE_MS);
  const candidates = await prisma.trackScoreReport.findMany({
    where: {
      score: null,
      createdAt: { lt: cutoff },
      // Recoverable + owned: a real payment, or a signed-in claim. Anonymous
      // unclaimed /start rows are swept by the abandoned-report GC, not rebuilt.
      OR: [{ paidAt: { not: null } }, { claimedAt: { not: null } }],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, slug: true, paidAt: true, reviewerQuotes: true },
  });

  // Skip pay-to-continue walls (sealed + unpaid) — those are intentionally
  // ungenerated until payment; generation fires from the webhook on `paidAt`.
  const stuck = candidates.filter((r) => {
    const q = (r.reviewerQuotes ?? {}) as Record<string, unknown>;
    if (q.invalid) return false;
    if (q.sealed === true && r.paidAt == null) return false;
    return true;
  });

  let repaired = 0;
  let failed = 0;
  const attempted: string[] = [];
  for (const r of stuck.slice(0, INSTANT_SWEEP_LIMIT)) {
    attempted.push(r.slug);
    try {
      await generateAndStoreReport(r.id);
      repaired++;
    } catch (err) {
      failed++;
      console.error(`[score-sweep] instant re-read failed for ${r.slug}:`, err);
    }
  }

  if (stuck.length > 0) {
    console.log(
      `[score-sweep] ${stuck.length} owned report(s) stuck at score=null; repaired ${repaired}, failed ${failed} this run (${attempted.join(", ")})`
    );
  }
  return { stuck: stuck.length, repaired, failed, attempted };
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
