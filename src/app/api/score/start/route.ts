import { NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateAndStoreReport } from "@/lib/score-report-ai";
import { isSupportedTrackUrl, normalizeTrackUrl } from "@/lib/track-url";

// Deep DSP (Replicate stems) + LLM no longer fit in 60s — especially on a
// Replicate cold start. Needs Fluid compute / Pro for >60.
export const maxDuration = 300;

/**
 * Pre-auth submission ("start at click").
 *
 * Creates the report row and kicks the AI read off in the BACKGROUND, then
 * returns immediately with the slug + an anonymous `claimToken`. The caller
 * (the landing page) redirects the user into Google sign-in straight after, so
 * the read generates *during* the auth round-trip instead of after it.
 *
 * The report has no owner yet (email is blank) — /api/score/claim attaches the
 * authenticated user once they're back. Reports that are never claimed are
 * swept by the abandoned-report GC, so we never keep junk from people who bail
 * at the login screen.
 *
 * No email is required here (we don't have one until auth), so abuse is capped
 * by client IP instead of by email.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { trackUrl, trackTitle, genre, notes } = (body ?? {}) as {
      trackUrl?: string;
      trackTitle?: string;
      genre?: string;
      notes?: string;
    };

    if (!trackUrl?.trim()) {
      return NextResponse.json({ error: "A track link is required." }, { status: 400 });
    }

    if (!isSupportedTrackUrl(trackUrl)) {
      return NextResponse.json(
        { error: "We can't read that link. Paste a SoundCloud, YouTube, Bandcamp or direct MP3 link." },
        { status: 400 }
      );
    }

    // Abuse guard: each start fires a paid LLM call, and there's no email to key
    // off pre-auth, so cap per client IP in a short window.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const HOURLY_LIMIT = 12;
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.trackScoreReport.count({
      where: { createdByIp: ip, createdAt: { gte: since } },
    });
    if (recentCount >= HOURLY_LIMIT) {
      return NextResponse.json(
        { error: "You've submitted a lot of tracks recently. Try again in a little while." },
        { status: 429 }
      );
    }

    const claimToken = randomUUID();
    const report = await prisma.trackScoreReport.create({
      data: {
        email: "", // unknown until /claim attaches the authenticated user
        trackUrl: normalizeTrackUrl(trackUrl),
        trackTitle: trackTitle?.trim() || null,
        genre: genre?.trim() || "Other",
        notes: notes?.trim() || null,
        status: "PENDING",
        claimToken,
        createdByIp: ip,
      },
      select: { id: true, slug: true },
    });

    // Generate in the background so the response returns instantly and the read
    // builds during the auth round-trip. `after` keeps the invocation alive past
    // the response (up to maxDuration). If it's killed early, the report page's
    // PendingState re-kicks generation via /api/score/[slug]/generate, so this is
    // a head start, not a single point of failure.
    after(async () => {
      try {
        await generateAndStoreReport(report.id);
      } catch (err) {
        console.error("[score/start] background generation error:", err);
      }
    });

    return NextResponse.json({ slug: report.slug, claimToken });
  } catch (error) {
    console.error("Score start error:", error);
    return NextResponse.json(
      { error: "Failed to start your read. Please try again." },
      { status: 500 }
    );
  }
}
