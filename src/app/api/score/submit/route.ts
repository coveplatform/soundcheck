import { NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAndStoreReport, regenerateDeepReport } from "@/lib/score-report-ai";
import { decideRoomEligibility } from "@/lib/score-review";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { sendAdminNewScoreSubmissionEmail } from "@/lib/email";
import { isSupportedTrackUrl, normalizeTrackUrl } from "@/lib/track-url";

// Deep DSP (Replicate stems) + LLM no longer fit in 60s — especially on a
// Replicate cold start. Needs Fluid compute / Pro for >60.
export const maxDuration = 300;

/**
 * Free submission / finalize. No payment up front.
 *
 * Two paths:
 *  1. PRE-STARTED (start-on-paste): the client pasted a link and
 *     /api/score/start already created the report and kicked generation in the
 *     background. The body carries that report's `slug` + `claimToken` — we
 *     patch on the details typed since (title/genre/notes), attach the owner,
 *     and return. Generation re-reads the row before building the LLM prompt,
 *     so those values still shape the read.
 *  2. FRESH: no usable pre-start (start failed, rate-limited, URL swapped, or
 *     an old client). Create the report and kick generation in the background.
 *
 * Either way the slug returns immediately — the report page's pending view
 * shows progress and flips to the read when it lands. Nothing here waits on
 * generation, so a slow read can't time the request out and lose the slug.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const { trackUrl, trackTitle, genre, notes, email, slug, claimToken } = (body ?? {}) as {
      trackUrl?: string;
      trackTitle?: string;
      genre?: string;
      notes?: string;
      email?: string;
      slug?: string;
      claimToken?: string;
    };

    const effectiveEmail = (email || session?.user?.email || "").trim();
    const effectiveGenre = genre?.trim() || "Other";

    if (!trackUrl?.trim() || !effectiveEmail) {
      return NextResponse.json(
        { error: "A track link and email are required." },
        { status: 400 }
      );
    }

    if (!isSupportedTrackUrl(trackUrl)) {
      return NextResponse.json(
        { error: "We can't read that link. Paste a SoundCloud, YouTube, Bandcamp or direct MP3 link." },
        { status: 400 }
      );
    }
    const normalizedTrackUrl = normalizeTrackUrl(trackUrl);

    const artistId = session?.user?.id
      ? await prisma.artistProfile
          .findUnique({ where: { userId: session.user.id }, select: { id: true } })
          .then((p) => p?.id ?? null)
      : null;

    // ── Path 1: finalize a pre-started report ──────────────────────────
    let report: { id: string; slug: string } | null = null;
    if (slug && claimToken) {
      const existing = await prisma.trackScoreReport.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          trackUrl: true,
          claimToken: true,
          claimedAt: true,
        },
      });
      // Token must match, be unclaimed, and point at the SAME track URL being
      // submitted (the user may have swapped links after the start fired — the
      // stale start is left for the abandoned-report GC to sweep).
      if (
        existing &&
        !existing.claimedAt &&
        existing.claimToken === claimToken &&
        existing.trackUrl === normalizedTrackUrl
      ) {
        report = await prisma.trackScoreReport.update({
          where: { id: existing.id },
          data: {
            email: effectiveEmail,
            ...(trackTitle?.trim() ? { trackTitle: trackTitle.trim() } : {}),
            ...(genre?.trim() ? { genre: genre.trim() } : {}),
            ...(notes?.trim() ? { notes: notes.trim() } : {}),
            ...(artistId ? { artistId } : {}),
            claimedAt: new Date(),
            claimToken: null, // single-use
          },
          select: { id: true, slug: true },
        });
      }
    }

    // ── Path 2: fresh submit ───────────────────────────────────────────
    if (!report) {
      // Basic abuse guard: each submit triggers a paid LLM call, so cap how many
      // a single email can fire in a short window. (Pre-started reports were
      // already IP-capped at /start, so this only guards the fresh path.)
      const HOURLY_LIMIT = 8;
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await prisma.trackScoreReport.count({
        where: { email: effectiveEmail, createdAt: { gte: since } },
      });
      if (recentCount >= HOURLY_LIMIT) {
        return NextResponse.json(
          { error: "You've submitted a lot of tracks recently. Try again in a little while." },
          { status: 429 }
        );
      }

      report = await prisma.trackScoreReport.create({
        data: {
          email: effectiveEmail,
          trackUrl: normalizedTrackUrl,
          trackTitle: trackTitle?.trim() || null,
          genre: effectiveGenre,
          notes: notes?.trim() || null,
          artistId,
          status: "PENDING",
        },
        select: { id: true, slug: true },
      });

      // Generate in the background — the slug returns right away and the report
      // page's pending view takes over. If this invocation is killed early, the
      // pending page's /generate self-heal re-kicks generation.
      const reportId = report.id;
      after(async () => {
        try {
          await generateAndStoreReport(reportId);
        } catch (err) {
          console.error("[score/submit] background generation error:", err);
        }
      });
    }

    // Unlimited subscribers: auto-unlock this report (the gate is paidAt != null).
    let unlocked = false;
    try {
      if (await isScoreSubscribed(effectiveEmail)) {
        await prisma.trackScoreReport.update({
          where: { id: report.id },
          data: { paidAt: new Date() },
        });
        unlocked = true;
      }
    } catch (err) {
      console.error("[score/submit] auto-unlock error:", err);
    }

    // The human "room of 5" is a paid feature — only assign once the report is
    // unlocked (subscriber here, or on payment via the Stripe webhook). Free
    // submitters get the instant AI read + teaser only, so we never pay
    // reviewers for tracks that are never unlocked.
    //
    // It's also metered for subscribers: each gets SCORE_ROOM_CAP real-reviewer
    // rounds per 30-day cycle. Over the cap the report still unlocks with the
    // full AI read, but the room is skipped (flagged) so it's excluded from the
    // reviewer claim pool. Within the cap, an unlocked report becomes claimable
    // automatically — reviewers pull tracks from the pool rather than us pushing.
    if (unlocked) {
      try {
        // Atomic: serializes per-subscriber so the monthly cap can't be raced.
        await decideRoomEligibility(effectiveEmail, report.id);
      } catch (err) {
        console.error("[score/submit] room eligibility error:", err);
      }
      // Premium deep read. Idempotent + guarded (no-ops until the instant read
      // is in); generation's end-of-run paidAt re-check covers the case where
      // the read is still being written — between the two it fires exactly once.
      const reportId = report.id;
      after(() =>
        regenerateDeepReport(reportId).catch((err) =>
          console.error("[score/submit] deep report error:", err)
        )
      );
    }

    // Ping admin on every committed submission (fire-and-forget — never blocks).
    void sendAdminNewScoreSubmissionEmail({
      trackTitle: trackTitle?.trim() || normalizedTrackUrl,
      artistEmail: effectiveEmail,
      genre: effectiveGenre,
      reportSlug: report.slug,
      unlocked,
    }).catch((err) => console.error("[score/submit] admin notify error:", err));

    return NextResponse.json({ slug: report.slug });
  } catch (error) {
    console.error("Score submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit your track. Please try again." },
      { status: 500 }
    );
  }
}
