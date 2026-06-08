import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAndStoreReport } from "@/lib/score-report-ai";
import { assignScoreReviewers } from "@/lib/score-review";
import { isScoreSubscribed } from "@/lib/score-subscription";

export const maxDuration = 60;

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
        trackUrl: trackUrl.trim(),
        trackTitle: trackTitle?.trim() || null,
        genre: effectiveGenre,
        notes: notes?.trim() || null,
        artistId,
        status: "PENDING",
      },
      select: { id: true, slug: true },
    });

    // Unlimited subscribers: auto-unlock this report (the gate is paidAt != null).
    try {
      if (await isScoreSubscribed(effectiveEmail)) {
        await prisma.trackScoreReport.update({
          where: { id: report.id },
          data: { paidAt: new Date() },
        });
      }
    } catch (err) {
      console.error("[score/submit] auto-unlock error:", err);
    }

    // Assign the human "room of 5" (best-effort — never blocks the submit).
    try {
      await assignScoreReviewers(report.id);
    } catch (err) {
      console.error("[score/submit] reviewer assignment error:", err);
    }

    // Generate the room's read inline so the report is populated on arrival.
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
