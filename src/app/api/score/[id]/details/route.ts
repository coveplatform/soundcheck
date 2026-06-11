import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isScoreGenre } from "@/lib/score-genres";

/**
 * Patch details onto a still-generating report. [id] is the report slug.
 *
 * The landing-page flow collects no genre, so the pending screen offers a
 * one-tap genre picker while the DSP runs — generation re-reads genre from the
 * row right before it writes the prompt, so a pick made during the wait still
 * shapes the read (genre norms, repetition tolerance, the listen prompt).
 *
 * Open by design (slug is an unguessable cuid, same posture as /generate and
 * /status), but only while the read hasn't landed: once `score` is set the
 * genre is part of a written report and changing it would desync the two.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;
    const body = (await request.json().catch(() => null)) as { genre?: string } | null;
    const genre = body?.genre;
    if (!isScoreGenre(genre)) {
      return NextResponse.json({ error: "Unknown genre" }, { status: 400 });
    }

    const updated = await prisma.trackScoreReport.updateMany({
      where: { slug, score: null },
      data: { genre },
    });
    if (updated.count === 0) {
      // Missing slug or the read already landed — either way, not patchable.
      return NextResponse.json({ ok: false, locked: true }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Score details error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
