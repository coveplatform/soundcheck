import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCreditsNudgeEmail } from "@/lib/email/nudge";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

// Free users with 3+ credits and no active submission in 7+ days
async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idleThreshold = new Date();
  idleThreshold.setUTCDate(idleThreshold.getUTCDate() - 7);

  // Max one nudge per user per 4 weeks (tracked by updatedAt on profile)
  const nudgeCooldown = new Date();
  nudgeCooldown.setUTCDate(nudgeCooldown.getUTCDate() - 28);

  const users = await (prisma as any).user.findMany({
    where: {
      ArtistProfile: {
        completedOnboarding: true,
        subscriptionStatus: { not: "active" },
        reviewCredits: { gte: 3 },
        lastCreditNudgeAt: { OR: [{ equals: null }, { lte: nudgeCooldown }] },
      },
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      name: true,
      ArtistProfile: {
        select: {
          id: true,
          artistName: true,
          reviewCredits: true,
          Track: {
            where: { status: { not: "COMPLETED" } },
            select: { id: true, title: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const profile = user.ArtistProfile;
    if (!profile || !user.email) { skipped++; continue; }

    // Check if they have an active submission (skip if already in queue)
    const activeSubmission = await (prisma as any).track.findFirst({
      where: {
        artistId: profile.id,
        status: "ACTIVE",
      },
    });
    if (activeSubmission) { skipped++; continue; }

    // Check idle — no review activity in last 7 days
    const recentReview = await (prisma as any).review.findFirst({
      where: {
        peerReviewerArtistId: profile.id,
        updatedAt: { gte: idleThreshold },
      },
    });
    if (recentReview) { skipped++; continue; }

    const name = profile.artistName || user.name || "there";
    const latestTrack = profile.Track?.[0];

    try {
      await sendCreditsNudgeEmail({
        to: user.email,
        name,
        credits: profile.reviewCredits,
        trackTitle: latestTrack?.title,
        trackId: latestTrack?.id,
      });

      // Record nudge so we don't spam
      await (prisma as any).artistProfile.update({
        where: { id: profile.id },
        data: { lastCreditNudgeAt: new Date() },
      });

      sent++;
    } catch (err) {
      console.error(`[credits-nudge] Failed to send to ${user.email}:`, err);
    }
  }

  return NextResponse.json({ success: true, sent, skipped });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
