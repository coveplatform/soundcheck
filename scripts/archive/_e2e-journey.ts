/**
 * End-to-end journey against LIVE prod + the real backend code.
 * Run: npx tsx --env-file=.env --env-file=.env.local scripts/_e2e-journey.ts
 * Creates an isolated artist + reviewer, exercises the full flow, then cleans up.
 */
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  assignScoreReviewers,
  submitScoreReview,
  getScoreReviewerEarnings,
  getScoreReviewQueue,
} from "@/lib/score-review";

const BASE = "https://www.mixreflect.com";
const TRACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const RUN = Date.now().toString(36);
const artistEmail = `_e2e_artist_${RUN}@mixreflect-test.invalid`;
const reviewerEmail = `_e2e_reviewer_${RUN}@mixreflect-test.invalid`;

let pass = 0, fail = 0;
const fails: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; fails.push(name); console.log(`  ✗ FAIL: ${name} ${detail}`); }
}

async function main() {
  let reportId = "", slug = "", artistId = "", reviewerId = "";

  try {
    // ── 1. SIGN UP (deployed endpoint) ──
    console.log("\n[1] signup");
    const su = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: artistEmail, password: "TestPass123!", acceptedTerms: true }),
    });
    const suData = await su.json().catch(() => null);
    check("signup returns 201", su.status === 201, `(got ${su.status} ${JSON.stringify(suData)})`);
    const artist = await prisma.user.findFirst({ where: { email: artistEmail }, select: { id: true } });
    check("artist user created in DB", !!artist);
    artistId = artist?.id ?? "";

    // ── 2. SUBMIT A TRACK (deployed endpoint → real generation) ──
    console.log("\n[2] score submit + generation");
    const sub = await fetch(`${BASE}/api/score/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackUrl: TRACK, trackTitle: "E2E Test Track", email: artistEmail, genre: "Electronic" }),
    });
    const subData = await sub.json().catch(() => null);
    check("submit returns a slug", !!subData?.slug, `(got ${sub.status} ${JSON.stringify(subData)})`);
    slug = subData?.slug ?? "";

    const report = slug ? await prisma.trackScoreReport.findUnique({ where: { slug } }) : null;
    check("report row exists", !!report);
    reportId = report?.id ?? "";
    if (report) {
      check("report has a score", (report.score ?? 0) > 0, `(score=${report.score})`);
      check("status is IN_REVIEW (not stuck PENDING)", report.status === "IN_REVIEW", `(status=${report.status})`);
      const rq = (report.reviewerQuotes as { grounded?: boolean } | null) ?? {};
      check("read is GROUNDED in audio (worker working)", rq.grounded === true, `(grounded=${rq.grounded})`);
      check("free submit = NOT unlocked", report.paidAt == null);
    }
    const preAssign = await prisma.scoreReview.count({ where: { reportId } });
    check("GATING: free submit assigned 0 reviewers", preAssign === 0, `(found ${preAssign})`);

    // ── 3. REPORT PAGE renders (locked, with the waiting-room panel) ──
    console.log("\n[3] report page");
    const rp = await fetch(`${BASE}/report/${slug}`);
    const html = await rp.text();
    check("report page 200", rp.status === 200);
    check("locked report shows 'waiting' room panel", /waiting/i.test(html));
    check("report page shows a score", new RegExp(`>${report?.score}<`).test(html) || html.includes(String(report?.score)));

    // ── 4. UNLOCK → ASSIGNMENT (simulate the Stripe webhook) ──
    console.log("\n[4] unlock → assign the room");
    // make the artist a reviewer too, to prove self-exclusion
    await prisma.user.update({ where: { id: artistId }, data: { isScoreReviewer: true } });
    await prisma.trackScoreReport.update({ where: { id: reportId }, data: { paidAt: new Date(), status: "IN_REVIEW" } });
    const assigned = await assignScoreReviewers(reportId);
    check("unlock assigns reviewers", assigned > 0, `(assigned=${assigned})`);
    const rows = await prisma.scoreReview.findMany({ where: { reportId }, select: { reviewerId: true } });
    check("SELF-REVIEW GUARD: owner not assigned to own track", !rows.some((r) => r.reviewerId === artistId));

    // ── 5. REVIEWER journey ──
    console.log("\n[5] reviewer: queue → submit → earnings");
    const reviewer = await prisma.user.create({
      data: { email: reviewerEmail, password: await bcrypt.hash("TestPass123!", 10), emailVerified: new Date(), isScoreReviewer: true },
      select: { id: true },
    });
    reviewerId = reviewer.id;
    // ensure our test reviewer has an assignment on this report (isolated review)
    const exists = await prisma.scoreReview.findFirst({ where: { reportId, reviewerId } });
    if (!exists) {
      await prisma.scoreReview.create({ data: { reportId, reviewerId, status: "ASSIGNED", expiresAt: new Date(Date.now() + 3 * 864e5) } });
    }
    const queue = await getScoreReviewQueue(reviewerId);
    check("track shows in reviewer's queue", queue.some((q) => q.TrackScoreReport?.slug === slug));

    const myAssign = await prisma.scoreReview.findFirst({ where: { reportId, reviewerId }, select: { id: true } });
    const result = await submitScoreReview({
      reviewId: myAssign!.id, reviewerId,
      rating: 4, headline: "solid groove, hook lands",
      quote: "Really enjoyed this one, the groove holds and the hook lands early enough.", positive: true,
    });
    check("review submit returns earnings", !!result.earnings, JSON.stringify(result));
    check("reviewer earned +$0.40", (result as { earnedCents?: number }).earnedCents === 40);
    const done = await prisma.scoreReview.findUnique({ where: { id: myAssign!.id }, select: { status: true } });
    check("review marked COMPLETED", done?.status === "COMPLETED");
    const earn = await getScoreReviewerEarnings(reviewerId);
    check("reviewer balance reflects the review", earn.cents >= 40, `(cents=${earn.cents})`);

    // ── 6. SELF-REVIEW guard on submit ──
    console.log("\n[6] self-review guard");
    const selfAssign = await prisma.scoreReview.create({ data: { reportId, reviewerId: artistId, status: "ASSIGNED", expiresAt: new Date(Date.now() + 864e5) } });
    let threw = false;
    try {
      await submitScoreReview({ reviewId: selfAssign.id, reviewerId: artistId, rating: 5, headline: "mine is great", quote: "trying to review my own track here, should be blocked.", positive: true });
    } catch { threw = true; }
    check("submitting a review on your OWN track is blocked", threw);
    const artistQueue = await getScoreReviewQueue(artistId);
    check("your own track is filtered from your queue", !artistQueue.some((q) => q.TrackScoreReport?.slug === slug));

    // ── 7. DASHBOARD: the artist sees their report ──
    console.log("\n[7] dashboard data");
    const profile = await prisma.artistProfile.findUnique({ where: { userId: artistId }, select: { id: true } });
    const myReports = await prisma.trackScoreReport.findMany({
      where: { OR: [...(profile ? [{ artistId: profile.id }] : []), { email: artistEmail }] },
      select: { slug: true },
    });
    check("report appears on the artist's dashboard", myReports.some((r) => r.slug === slug));
  } finally {
    // ── CLEANUP ──
    console.log("\n[cleanup]");
    if (reportId) await prisma.trackScoreReport.delete({ where: { id: reportId } }).catch(() => {});
    if (reviewerId) await prisma.user.delete({ where: { id: reviewerId } }).catch(() => {});
    if (artistId) await prisma.user.delete({ where: { id: artistId } }).catch(() => {});
    // belt-and-suspenders: nuke any stragglers by email
    await prisma.trackScoreReport.deleteMany({ where: { email: { in: [artistEmail, reviewerEmail] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { in: [artistEmail, reviewerEmail] } } }).catch(() => {});
    console.log("  cleaned up test data");
  }

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  if (fail) console.log("FAILURES:\n - " + fails.join("\n - "));
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => { console.error("JOURNEY CRASHED:", e); await prisma.$disconnect(); process.exit(2); });
