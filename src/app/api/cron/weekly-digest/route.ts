import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestEmail } from "@/lib/email/digest";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

// Send to free users who have had any activity in the last 30 days
// Skip Pro users (they get auto-credits, less need for nudge)
async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - 7);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const activeThreshold = new Date(now);
  activeThreshold.setUTCDate(now.getUTCDate() - 30);

  // Fetch free users with activity in last 30 days
  const users = await (prisma as any).user.findMany({
    where: {
      ArtistProfile: {
        completedOnboarding: true,
        subscriptionStatus: { not: "active" },
        updatedAt: { gte: activeThreshold },
      },
      NOT: [{ email: null }],
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
          genrePreferences: true,
          Track: {
            where: { status: { not: "COMPLETED" } },
            select: {
              id: true,
              title: true,
              Review: {
                where: {
                  status: "COMPLETED",
                  updatedAt: { gte: startOfWeek },
                },
                select: { id: true },
              },
            },
            orderBy: { createdAt: "desc" },
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

    const name = profile.artistName || user.name || "there";

    // Credits earned this week (peer review credits)
    const creditsEarned = await (prisma as any).review.count({
      where: {
        peerReviewerArtistId: profile.id,
        status: "COMPLETED",
        updatedAt: { gte: startOfWeek },
      },
    });

    // Reviews received on their tracks this week
    const latestTrack = profile.Track?.[0];
    const reviewsReceived = latestTrack?.Review?.length ?? 0;

    // Tracks in their genre needing review
    const genrePrefs: string[] = profile.genrePreferences ?? [];
    const genreTrackCount = await (prisma as any).track.count({
      where: {
        status: "ACTIVE",
        artistId: { not: profile.id },
        ...(genrePrefs.length > 0 ? {
          Genre: { some: { id: { in: genrePrefs } } },
        } : {}),
      },
    });

    // Skip if truly nothing to say
    if (creditsEarned === 0 && reviewsReceived === 0 && genreTrackCount === 0) {
      skipped++;
      continue;
    }

    try {
      await sendWeeklyDigestEmail({
        to: user.email,
        name,
        creditsEarned,
        reviewsReceived,
        genreTrackCount,
        trackTitle: latestTrack?.title,
        trackId: latestTrack?.id,
      });
      sent++;
    } catch (err) {
      console.error(`[weekly-digest] Failed to send to ${user.email}:`, err);
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
