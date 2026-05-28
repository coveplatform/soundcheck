import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTotdDailyEmail } from "@/lib/email/totd-digest";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Yesterday's featured track with an editor note
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const featured = await (prisma as any).chartSubmission.findFirst({
      where: {
        isFeatured: true,
        editorNote: { not: null },
        chartDate: { gte: yesterday, lt: today },
      },
      select: {
        title: true,
        genre: true,
        editorNote: true,
        artworkUrl: true,
        chartDate: true,
        ArtistProfile: { select: { artistName: true } },
      },
    });

    if (!featured) {
      return NextResponse.json({ success: true, message: "No featured track with editor note for yesterday", sent: 0 });
    }

    const pick = {
      title: featured.title,
      artistName: featured.ArtistProfile?.artistName || "Unknown Artist",
      genre: featured.genre,
      editorNote: featured.editorNote,
      artworkUrl: featured.artworkUrl,
    };

    const dateLabel = new Date(featured.chartDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

    // Send to all users who've completed onboarding
    const users = await (prisma as any).user.findMany({
      where: {
        ArtistProfile: { completedOnboarding: true },
        NOT: [{ email: null }],
      },
      select: { email: true },
    });

    let sent = 0;
    for (const user of users) {
      if (!user.email) continue;
      try {
        await sendTotdDailyEmail({ to: user.email, pick, dateLabel });
        sent++;
      } catch (err) {
        console.error(`[totd-digest] Failed for ${user.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent, track: pick.title });
  } catch (err) {
    console.error("[totd-digest] Fatal error:", err);
    return NextResponse.json({ error: "Internal error", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
