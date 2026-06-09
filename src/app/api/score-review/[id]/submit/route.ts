import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { submitScoreReview } from "@/lib/score-review";

/** A human reviewer submits their reaction. [id] = ScoreReview id. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { rating, headline, quote, positive } = (body ?? {}) as {
      rating?: number;
      headline?: string;
      quote?: string;
      positive?: boolean;
    };

    if (!rating || !headline?.trim() || !quote?.trim()) {
      return NextResponse.json(
        { error: "A rating, a one-line headline and your reaction are required." },
        { status: 400 }
      );
    }

    const result = await submitScoreReview({
      reviewId: id,
      reviewerId: session.user.id,
      rating: Number(rating),
      headline: headline.trim(),
      quote: quote.trim(),
      positive: positive ?? Number(rating) >= 3,
    });

    return NextResponse.json({
      ok: true,
      alreadyDone: "alreadyDone" in result ? result.alreadyDone : false,
      earnedCents: "earnedCents" in result ? result.earnedCents : 0,
      earnings: result.earnings ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit";
    const status = msg.includes("Not your") ? 403 : msg.includes("not found") ? 404 : 500;
    console.error("Score review submit error:", error);
    return NextResponse.json({ error: msg }, { status });
  }
}
