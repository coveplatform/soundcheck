import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndStoreReport } from "@/lib/score-report-ai";

// Deep DSP (Replicate stems) + LLM no longer fit in 60s — especially on a
// Replicate cold start. Needs Fluid compute / Pro for >60.
export const maxDuration = 300;

/**
 * Idempotent generation / recovery endpoint. [id] is the report slug.
 *
 * The submit route generates inline, but a serverless timeout (or a transient
 * API error) can leave a report stuck at PENDING with no score. The pending
 * screen polls this endpoint: if the read is already in, it just reports ready;
 * if it's still missing, it (re)runs generation so the report can self-heal.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;

    const report = await prisma.trackScoreReport.findUnique({
      where: { slug },
      select: { id: true, score: true, paidAt: true, reviewerQuotes: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Already populated — nothing to do.
    if (report.score != null) {
      return NextResponse.json({ ready: true });
    }

    // SEALED, awaiting payment (pay-to-continue wall): never auto-generate — the
    // read is pay-gated. Generation fires from the Stripe webhook once paidAt is
    // set; until then this self-heal poll must not build the read for free.
    const sealed =
      (report.reviewerQuotes as { sealed?: boolean } | null)?.sealed === true;
    if (sealed && report.paidAt == null) {
      return NextResponse.json({ ready: false, sealed: true });
    }

    // A generation is already running (started recently in the background by
    // /start or /submit) — don't double-run it; the poller just keeps waiting.
    // Past the staleness window we assume that run was killed and re-kick.
    const progress = (report.reviewerQuotes as { progress?: { startedAt?: string } } | null)
      ?.progress;
    const startedAt = progress?.startedAt ? Date.parse(progress.startedAt) : NaN;
    const STALE_MS = 5 * 60 * 1000;
    if (Number.isFinite(startedAt) && Date.now() - startedAt < STALE_MS) {
      return NextResponse.json({ ready: false, running: true });
    }

    try {
      await generateAndStoreReport(report.id);
      return NextResponse.json({ ready: true });
    } catch (err) {
      console.error("[score/generate] generation error:", err);
      return NextResponse.json({ ready: false });
    }
  } catch (error) {
    console.error("Score generate error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
