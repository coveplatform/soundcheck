import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { claimAndAssignRoom } from "@/lib/score-review";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { sendAdminNewScoreSubmissionEmail } from "@/lib/email";

export const maxDuration = 60;

/**
 * Redeem a pre-auth report (created by /api/score/start) for the now
 * authenticated user.
 *
 * Verifies the anonymous claim token, attaches the user's email + artist
 * profile, and runs the post-submission side-effects that needed an identity:
 * auto-unlock for subscribers, the human "room" assignment, and the admin ping.
 * Idempotent — re-claiming an already-claimed report by the same user is a
 * no-op success.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.trim();
    if (!session?.user?.id || !email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { slug, claimToken } = (body ?? {}) as { slug?: string; claimToken?: string };
    if (!slug || !claimToken) {
      return NextResponse.json({ error: "Missing claim details" }, { status: 400 });
    }

    const report = await prisma.trackScoreReport.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, claimToken: true, claimedAt: true, email: true,
        trackTitle: true, trackUrl: true, genre: true,
      },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Already claimed: succeed if it's this user's, otherwise refuse.
    if (report.claimedAt || !report.claimToken) {
      if (report.email && report.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ slug: report.slug, alreadyClaimed: true });
      }
      return NextResponse.json({ error: "This report is already claimed." }, { status: 409 });
    }

    // Wrong token for this slug — don't let anyone claim a report they didn't start.
    if (report.claimToken !== claimToken) {
      return NextResponse.json({ error: "Invalid claim token." }, { status: 403 });
    }

    const artistId = await prisma.artistProfile
      .findUnique({ where: { userId: session.user.id }, select: { id: true } })
      .then((p) => p?.id ?? null);

    await prisma.trackScoreReport.update({
      where: { id: report.id },
      data: {
        email,
        artistId,
        claimedAt: new Date(),
        claimToken: null, // single-use
      },
    });

    // Subscribers: auto-unlock + assign the human room (metered). Mirrors the
    // logic in /api/score/submit, deferred to here because it needs the email.
    let unlocked = false;
    try {
      if (await isScoreSubscribed(email)) {
        await prisma.trackScoreReport.update({
          where: { id: report.id },
          data: { paidAt: new Date() },
        });
        unlocked = true;
        // Atomic per-subscriber claim of a real-reviewer round.
        await claimAndAssignRoom(email, report.id);
      }
    } catch (err) {
      console.error("[score/claim] unlock/assign error:", err);
    }

    // Ping admin now that the upload has a committed, signed-in owner.
    void sendAdminNewScoreSubmissionEmail({
      trackTitle: report.trackTitle || report.trackUrl,
      artistEmail: email,
      genre: report.genre || "Other",
      reportSlug: report.slug,
      unlocked,
    }).catch((err) => console.error("[score/claim] admin notify error:", err));

    return NextResponse.json({ slug: report.slug });
  } catch (error) {
    console.error("Score claim error:", error);
    return NextResponse.json({ error: "Failed to claim your report." }, { status: 500 });
  }
}
