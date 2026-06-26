import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight progress poll for the pending report page. [id] is the slug.
 *
 * Generation writes to the row in stages (oEmbed title/artwork almost
 * immediately, a `progress.analyzed` marker once the DSP lands, everything
 * else at completion) — this endpoint exposes those stages so the pending view
 * can fill in pieces as they become available instead of sitting on a spinner.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;

    const report = await prisma.trackScoreReport.findUnique({
      where: { slug },
      select: {
        score: true,
        verdict: true,
        trackTitle: true,
        artworkUrl: true,
        reviewerQuotes: true,
      },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const ready = report.score != null;
    const progress = ready
      ? null
      : (report.reviewerQuotes as { progress?: { startedAt?: string; analyzed?: boolean } } | null)
          ?.progress ?? null;
    const startedAt = progress?.startedAt ? Date.parse(progress.startedAt) : NaN;
    // Mirrors the staleness window in /generate: a "running" generation that
    // went quiet for 5 minutes is presumed killed (the poller re-kicks it).
    const STALE_MS = 5 * 60 * 1000;
    const running =
      !ready && Number.isFinite(startedAt) && Date.now() - startedAt < STALE_MS;

    return NextResponse.json({
      ready,
      running,
      analyzed: Boolean(progress?.analyzed),
      // The verdict headline (ladder + score) is free even before claim — it's
      // what lets the landing reveal the result before asking for an account.
      score: ready ? report.score : null,
      verdict: ready ? report.verdict ?? null : null,
      trackTitle: report.trackTitle,
      artworkUrl: report.artworkUrl,
    });
  } catch (error) {
    console.error("Score status error:", error);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
