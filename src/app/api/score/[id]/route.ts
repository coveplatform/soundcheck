import { NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSupportedTrackUrl,
  isPrivateSoundcloudUrl,
  normalizeTrackUrl,
  PRIVATE_SOUNDCLOUD_REASON,
} from "@/lib/track-url";
import { resolveShortUrl } from "@/lib/metadata";
import { generateAndStoreReport } from "@/lib/score-report-ai";

// [id] = TrackScoreReport id.
type Ctx = { params: Promise<{ id: string }> };

/** Ownership check shared by DELETE + PATCH: by email or linked artist profile. */
async function loadOwned(id: string, userId: string, userEmail: string | null | undefined) {
  const report = await prisma.trackScoreReport.findUnique({
    where: { id },
    select: { id: true, email: true, artistId: true, paidAt: true, stripeSessionId: true },
  });
  if (!report) return { report: null, owned: false as const };
  const profile = await prisma.artistProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  const ownsByEmail =
    !!report.email && !!userEmail && report.email.toLowerCase() === userEmail.toLowerCase();
  const ownsByArtist = !!report.artistId && !!profile && report.artistId === profile.id;
  return { report, owned: ownsByEmail || ownsByArtist };
}

/**
 * DELETE /api/score/[id] — remove one of your own score reports.
 *
 * Refuses to delete a PAID report: the $6.95 unlock (and any human-room work)
 * lives on this row, so a hard delete would vaporise what the customer paid for
 * with no refund or record (exactly how a paid report was lost before). Paid
 * reports must be changed via PATCH (edit link), not deleted.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const { report, owned } = await loadOwned(id, session.user.id, session.user.email);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!owned) return NextResponse.json({ error: "Not your track" }, { status: 403 });

  if (report.paidAt) {
    return NextResponse.json(
      {
        error:
          "This report is unlocked — deleting it would lose what you paid for. Use “edit link” to change the track instead, or contact support.",
        code: "paid_report",
      },
      { status: 409 }
    );
  }

  // Cascades the assigned ScoreReviews (and clears them from reviewers' queues).
  await prisma.trackScoreReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/score/[id] — change a report's track link without destroying it.
 *
 * The non-destructive alternative to delete+resubmit: it updates `trackUrl` on
 * the SAME row and re-runs analysis, so `paidAt` / `stripeSessionId` and the
 * human room survive. This is what removes the only reason a customer ever had
 * to delete a paid report (there was no edit path before).
 *
 * Body: { trackUrl: string }
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const { report, owned } = await loadOwned(id, session.user.id, session.user.email);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!owned) return NextResponse.json({ error: "Not your track" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const trackUrl = (body as { trackUrl?: string } | null)?.trackUrl?.trim();
  if (!trackUrl) {
    return NextResponse.json({ error: "A track link is required." }, { status: 400 });
  }
  if (!isSupportedTrackUrl(trackUrl)) {
    return NextResponse.json(
      { error: "We can't read that link. Paste a SoundCloud, YouTube, Bandcamp or direct MP3 link." },
      { status: 400 }
    );
  }
  const normalizedTrackUrl = await resolveShortUrl(normalizeTrackUrl(trackUrl));
  if (isPrivateSoundcloudUrl(normalizedTrackUrl)) {
    return NextResponse.json({ error: PRIVATE_SOUNDCLOUD_REASON }, { status: 400 });
  }

  // Re-analyse on the same row: clear the read (score + generated payload) so the
  // pipeline regenerates against the new link, but KEEP paidAt / stripeSessionId
  // / artist / email and the ScoreReview room. A paid report stays paid; an
  // unpaid one stays its same free/sealed self.
  await prisma.trackScoreReport.update({
    where: { id },
    data: {
      trackUrl: normalizedTrackUrl,
      status: "PENDING",
      score: null,
      percentile: null,
      verdict: null,
      hookScore: null,
      productionScore: null,
      retentionScore: null,
      emotionalScore: null,
      commercialScore: null,
      aiSummary: null,
      reviewerQuotes: {},
      priorityFixes: [],
      // Nullable JSON columns: `undefined` would SKIP the field (leaving stale
      // data if the re-read comes back ungrounded), so clear to DB NULL.
      releaseBar: Prisma.DbNull,
      blockers: Prisma.DbNull,
      waveform: Prisma.DbNull,
      fingerprint: Prisma.DbNull,
    },
  });

  // Generation is idempotent (atomic claim); fire-and-forget, the sweeps recover
  // it if this invocation dies. A paid report auto-chains the deep read.
  after(() => generateAndStoreReport(id).catch((err) =>
    console.error(`[score] re-analysis after edit-link failed for ${id}:`, err)
  ));

  return NextResponse.json({ ok: true, slug: report.id });
}
