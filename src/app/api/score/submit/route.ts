import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAndStoreReport } from "@/lib/score-report-ai";
import { decideRoomEligibility } from "@/lib/score-review";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { sendAdminNewScoreSubmissionEmail } from "@/lib/email";
import { isSupportedTrackUrl, normalizeTrackUrl } from "@/lib/track-url";

// Deep DSP (Replicate stems) + LLM no longer fit in 60s — especially on a
// Replicate cold start. Needs Fluid compute / Pro for >60.
export const maxDuration = 300;

/**
 * Free submission. No payment up front.
 * Creates the report, generates the room's read, and returns the slug so the
 * artist lands straight on their (gated) report. They pay later to unlock.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const { trackUrl, trackTitle, genre, notes, email } = (body ?? {}) as {
      trackUrl?: string;
      trackTitle?: string;
      genre?: string;
      notes?: string;
      email?: string;
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

    // Basic abuse guard: each submit triggers a paid LLM call, so cap how many
    // a single email can fire in a short window.
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

    const artistId = session?.user?.id
      ? await prisma.artistProfile
          .findUnique({ where: { userId: session.user.id }, select: { id: true } })
          .then((p) => p?.id ?? null)
      : null;

    const report = await prisma.trackScoreReport.create({
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
    }

    // Ping admin on every upload (fire-and-forget — never blocks the submit).
    void sendAdminNewScoreSubmissionEmail({
      trackTitle: trackTitle?.trim() || normalizedTrackUrl,
      artistEmail: effectiveEmail,
      genre: effectiveGenre,
      reportSlug: report.slug,
      unlocked,
    }).catch((err) => console.error("[score/submit] admin notify error:", err));

    // Generate the AI read inline so the report is populated on arrival (free).
    // generateAndStoreReport never throws on API failure (it falls back).
    try {
      await generateAndStoreReport(report.id);
    } catch (err) {
      console.error("[score/submit] generation error:", err);
      // Leave the row PENDING; the report page shows a "preparing" state.
    }

    return NextResponse.json({ slug: report.slug });
  } catch (error) {
    console.error("Score submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit your track. Please try again." },
      { status: 500 }
    );
  }
}
