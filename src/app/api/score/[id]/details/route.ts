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
    const body = (await request.json().catch(() => null)) as {
      genre?: string;
      scoreGuess?: number;
    } | null;

    const genre = body?.genre;
    const rawGuess = body?.scoreGuess;
    const guess =
      typeof rawGuess === "number" && Number.isFinite(rawGuess)
        ? Math.round(Math.max(1, Math.min(100, rawGuess)))
        : null;

    if (genre !== undefined && !isScoreGenre(genre)) {
      return NextResponse.json({ error: "Unknown genre" }, { status: 400 });
    }
    if (genre === undefined && guess == null) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    let patched = 0;
    if (genre !== undefined) {
      const r = await prisma.trackScoreReport.updateMany({
        where: { slug, score: null },
        data: { genre },
      });
      patched += r.count;
    }
    // The prediction is one-shot and only before the score exists — once the
    // number is visible (or a guess is locked), "predicting" is meaningless.
    if (guess != null) {
      const r = await prisma.trackScoreReport.updateMany({
        where: { slug, score: null, scoreGuess: null },
        data: { scoreGuess: guess },
      });
      patched += r.count;
    }

    if (patched === 0) {
      // Missing slug or the read already landed — either way, not patchable.
      return NextResponse.json({ ok: false, locked: true }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Score details error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
