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

// Free users with any credits whose last login was 1+ days ago
async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idle = not logged in for at least 1 day
  const idleThreshold = new Date();
  idleThreshold.setUTCDate(idleThreshold.getUTCDate() - 1);

  // Max one nudge per user per 4 weeks
  const nudgeCooldown = new Date();
  nudgeCooldown.setUTCDate(nudgeCooldown.getUTCDate() - 28);

  const users = await prisma.user.findMany({
    where: {
      NOT: { email: { endsWith: "@seed.mixreflect.com" } },
      // Not logged in for at least 1 day (null = never logged in after tracking started)
      OR: [
        { lastActiveAt: { lte: idleThreshold } },
        { lastActiveAt: null },
      ],
      ArtistProfile: {
        is: {
          completedOnboarding: true,
          subscriptionStatus: { not: "active" },
          reviewCredits: { gte: 1 },
          OR: [
            { lastCreditNudgeAt: null },
            { lastCreditNudgeAt: { lte: nudgeCooldown } },
          ],
        },
      },
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

    // Skip if they already have a track actively in the review queue —
    // nudging someone who's already engaged with the product is unnecessary.
    const activeSubmission = await prisma.track.findFirst({
      where: {
        artistId: profile.id,
        status: { in: ["QUEUED", "IN_PROGRESS"] },
      },
    });
    if (activeSubmission) { skipped++; continue; }

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
      await prisma.artistProfile.update({
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
