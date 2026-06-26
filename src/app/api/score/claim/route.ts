import { NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decideRoomEligibility } from "@/lib/score-review";
import { regenerateDeepReport } from "@/lib/score-report-ai";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { freeReadUsed } from "@/lib/score-free-cap";
import { ensureArtistProfile } from "@/lib/ensure-artist-profile";
import { sendAdminNewScoreSubmissionEmail } from "@/lib/email";

// Deep DSP (Replicate stems) + LLM no longer fit in 60s — especially on a
// Replicate cold start. Needs Fluid compute / Pro for >60.
export const maxDuration = 300;

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

    // Free-tier ladder (open-read model only): same flag as /submit — claiming
    // past the lifetime free read is fine, the report just renders sealed.
    // Computed BEFORE the email attaches so this claim doesn't count itself.
    const usedFreeRead = await freeReadUsed(email);

    const artistId = await ensureArtistProfile(session.user.id);

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
        // Atomic per-subscriber grant of a real-reviewer round (honors the cap).
        await decideRoomEligibility(email, report.id);
        // Premium deep read (score stays locked). Idempotent + guards on the
        // instant read being done, so it's safe even if generation is still
        // running — generateAndStoreReport re-triggers it on completion.
        after(() => regenerateDeepReport(report.id).catch((err) =>
          console.error("[score/claim] deep report error:", err)
        ));
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

    return NextResponse.json({ slug: report.slug, freeReadUsed: usedFreeRead });
  } catch (error) {
    console.error("Score claim error:", error);
    return NextResponse.json({ error: "Failed to claim your report." }, { status: 500 });
  }
}
