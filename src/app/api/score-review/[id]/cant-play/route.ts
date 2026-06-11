import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL, emailWrapper, emailButton, getAppUrl, sendEmail } from "@/lib/email";

/**
 * A reviewer flags that the track won't play (deleted/private/broken link).
 * [id] = ScoreReview id.
 *
 * Without this, a seat on a dead link has two exits — submit a made-up
 * reaction, or sit on it until the 3-day claim TTL expires. Both are bad.
 * This releases the seat immediately (status EXPIRED → doesn't count toward
 * the room, reopens for others; the row survives so the flagging reviewer
 * isn't re-offered the same track) and records the flag on the report. Two
 * distinct reviewers flagging the same track pings admin once.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    const review = await prisma.scoreReview.findUnique({
      where: { id },
      select: { id: true, reviewerId: true, reportId: true, status: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    if (review.reviewerId !== session.user.id) {
      return NextResponse.json({ error: "Not your assignment" }, { status: 403 });
    }
    if (review.status === "COMPLETED") {
      return NextResponse.json(
        { error: "You've already submitted a reaction for this track." },
        { status: 409 }
      );
    }

    const report = await prisma.trackScoreReport.findUnique({
      where: { id: review.reportId },
      select: { id: true, slug: true, trackTitle: true, trackUrl: true, email: true, reviewerQuotes: true },
    });

    // Release the seat.
    await prisma.scoreReview.update({
      where: { id },
      data: { status: "EXPIRED", expiresAt: new Date() },
    });

    if (report) {
      const quotes = (report.reviewerQuotes ?? {}) as Record<string, unknown>;
      const flaggedBy = Array.isArray(quotes.unplayableBy)
        ? (quotes.unplayableBy as string[])
        : [];
      if (!flaggedBy.includes(session.user.id)) flaggedBy.push(session.user.id);

      // jsonb_set, never a wholesale write — the quotes blob holds the live
      // report content and a concurrent generation/deep pass may be writing it.
      await prisma
        .$executeRaw`UPDATE "TrackScoreReport" SET "reviewerQuotes" = jsonb_set(COALESCE("reviewerQuotes", '{}'::jsonb), '{unplayableBy}', ${JSON.stringify(flaggedBy)}::jsonb) WHERE id = ${report.id}`;

      // Second distinct flag = it's the track, not one reviewer's setup.
      if (flaggedBy.length >= 2 && !quotes.unplayableAlertedAt) {
        await prisma
          .$executeRaw`UPDATE "TrackScoreReport" SET "reviewerQuotes" = jsonb_set(COALESCE("reviewerQuotes", '{}'::jsonb), '{unplayableAlertedAt}', to_jsonb(${new Date().toISOString()}::text)) WHERE id = ${report.id}`;
        const content = `
          <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700;">Reviewers can't play a track</h1>
          <p style="margin: 0 0 16px;">
            ${flaggedBy.length} reviewers flagged <strong>${report.trackTitle || "untitled"}</strong>
            (${report.email || "unclaimed"}) as unplayable — the link is likely dead or private:<br>
            <a href="${report.trackUrl}">${report.trackUrl}</a>
          </p>
          ${emailButton("View report", `${getAppUrl()}/report/${report.slug}`)}
        `;
        void sendEmail({
          to: ADMIN_EMAIL,
          subject: `⚠️ Unplayable track: ${report.trackTitle || report.trackUrl}`,
          html: emailWrapper(content),
        }).catch((err) => console.error("[cant-play] admin alert failed:", err));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Score review cant-play error:", error);
    return NextResponse.json({ error: "Failed to flag the track." }, { status: 500 });
  }
}
