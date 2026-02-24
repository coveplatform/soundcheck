import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/charts/submit
 * Submit (or replace) a track in today's daily chart.
 * Body: { trackId: string }
 *
 * Rules (Option A — slot model):
 * - Free: 1 active slot. Submitting always replaces your current entry.
 * - Pro:  3 active slots. Fills slots up to 3; when full, auto-replaces lowest vote count.
 * - No time-based cooldowns. No "new track" restriction.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const trackId = body?.trackId;

  if (!trackId || typeof trackId !== "string") {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  try {
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        completedOnboarding: true,
        subscriptionStatus: true,
      },
    });

    if (!artistProfile || !artistProfile.completedOnboarding) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        sourceUrl: true,
        sourceType: true,
        artistId: true,
        Genre: { select: { name: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artistId !== artistProfile.id) {
      return NextResponse.json({ error: "You can only submit your own tracks" }, { status: 403 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const isPro = artistProfile.subscriptionStatus === "active";
    const maxSlots = isPro ? 3 : 1;

    // Get today's submissions ordered by vote count asc (lowest first for auto-replace)
    const todaySubmissions = await (prisma as any).chartSubmission.findMany({
      where: { artistId: artistProfile.id, chartDate: today },
      orderBy: { voteCount: "asc" },
    });

    // Check if this exact track is already submitted today
    const alreadySubmittedThisTrack = todaySubmissions.find(
      (s: any) => s.trackId === track.id
    );
    if (alreadySubmittedThisTrack) {
      return NextResponse.json(
        { error: "This track is already in today's chart" },
        { status: 409 }
      );
    }

    // If at capacity, remove the lowest-voted submission to make room
    if (todaySubmissions.length >= maxSlots) {
      const toReplace = todaySubmissions[0]; // lowest vote count
      await (prisma as any).chartSubmission.delete({ where: { id: toReplace.id } });
    }

    const genre = track.Genre?.[0]?.name || null;

    const submission = await (prisma as any).chartSubmission.create({
      data: {
        trackId: track.id,
        artistId: artistProfile.id,
        chartDate: today,
        title: track.title,
        artworkUrl: track.artworkUrl,
        sourceUrl: track.sourceUrl,
        sourceType: track.sourceType,
        genre,
      },
    });

    const wasReplacement = todaySubmissions.length >= maxSlots;

    return NextResponse.json({
      id: submission.id,
      message: wasReplacement ? "Track replaced in today's chart!" : "Track submitted to today's chart!",
      replaced: wasReplacement,
      chartDate: today.toISOString().split("T")[0],
    });
  } catch (err: any) {
    console.error("Chart submit error:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Already submitted to today's chart" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
