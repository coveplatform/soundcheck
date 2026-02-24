import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charts/analytics?submissionId=xxx
 * Pro-only: Returns detailed vote analytics for a chart submission.
 * - Who voted (names, images)
 * - Listen durations per voter
 * - Vote timeline (when votes came in)
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 }
    );
  }

  try {
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, subscriptionStatus: true },
    });

    if (!artistProfile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isPro = artistProfile.subscriptionStatus === "active";
    if (!isPro) {
      return NextResponse.json(
        { error: "Chart analytics requires Pro. Upgrade to see who voted for your tracks.", upgrade: true },
        { status: 403 }
      );
    }

    // Verify this submission belongs to the user
    const submission = await (prisma as any).chartSubmission.findFirst({
      where: { id: submissionId, artistId: artistProfile.id },
      select: {
        id: true,
        title: true,
        voteCount: true,
        playCount: true,
        rank: true,
        chartDate: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or not yours" },
        { status: 404 }
      );
    }

    // Get all votes with voter info
    const votes = await (prisma as any).chartVote.findMany({
      where: { submissionId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        listenDuration: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    const avgListenDuration =
      votes.length > 0
        ? Math.round(
            votes.reduce((sum: number, v: any) => sum + v.listenDuration, 0) /
              votes.length
          )
        : 0;

    // Vote timeline — group by hour
    const timeline: Record<string, number> = {};
    for (const vote of votes) {
      const hour = new Date(vote.createdAt).getUTCHours();
      const key = `${hour.toString().padStart(2, "0")}:00`;
      timeline[key] = (timeline[key] || 0) + 1;
    }

    return NextResponse.json({
      analytics: {
        submissionId: submission.id,
        title: submission.title,
        voteCount: submission.voteCount,
        playCount: submission.playCount,
        rank: submission.rank,
        date: submission.chartDate,
        conversionRate:
          submission.playCount > 0
            ? Math.round((submission.voteCount / submission.playCount) * 100)
            : 0,
        avgListenDuration,
        voters: votes.map((v: any) => ({
          name: v.User?.name || "Anonymous",
          image: v.User?.image || null,
          listenDuration: v.listenDuration,
          votedAt: v.createdAt,
        })),
        timeline: Object.entries(timeline)
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour.localeCompare(b.hour)),
      },
    });
  } catch (err: any) {
    console.error("Chart analytics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
