import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTotdWeeklyEmail } from "@/lib/email/totd-digest";

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

  // Last 7 days of featured tracks with editor notes
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  since.setUTCHours(0, 0, 0, 0);

  const featured = await (prisma as any).chartSubmission.findMany({
    where: {
      isFeatured: true,
      editorNote: { not: null },
      chartDate: { gte: since },
    },
    select: {
      title: true,
      genre: true,
      editorNote: true,
      artworkUrl: true,
      ArtistProfile: { select: { artistName: true } },
    },
    orderBy: { chartDate: "desc" },
    take: 5,
  });

  if (featured.length === 0) {
    return NextResponse.json({ success: true, message: "No featured tracks with editor notes this week", sent: 0 });
  }

  const picks = featured.map((f: any) => ({
    title: f.title,
    artistName: f.ArtistProfile?.artistName || "Unknown Artist",
    genre: f.genre,
    editorNote: f.editorNote,
    artworkUrl: f.artworkUrl,
  }));

  // Week label e.g. "May 19–25"
  const end = new Date();
  const start = new Date(since);
  const weekLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${end.toLocaleDateString("en-US", { day: "numeric" })}`;

  // Send to all users who've completed onboarding
  const users = await (prisma as any).user.findMany({
    where: {
      ArtistProfile: { completedOnboarding: true },
      email: { not: null },
    },
    select: { email: true, name: true, ArtistProfile: { select: { artistName: true } } },
  });

  let sent = 0;
  for (const user of users) {
    if (!user.email) continue;
    try {
      await sendTotdWeeklyEmail({ to: user.email, picks, weekLabel });
      sent++;
    } catch (err) {
      console.error(`[totd-digest] Failed for ${user.email}:`, err);
    }
  }

  return NextResponse.json({ success: true, sent, picks: picks.length });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
