import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_LISTEN_DURATION = 30; // seconds

/**
 * POST /api/charts/vote
 * Vote for a chart submission.
 * Body: { submissionId: string, listenDuration: number }
 * 
 * Anti-gaming rules:
 * - Must have listened for at least 30 seconds
 * - 1 vote per user per submission
 * - Can't vote for your own submission
 * - Account must be at least 1 hour old
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const submissionId = body?.submissionId;
  const listenDuration = body?.listenDuration || 0;

  if (!submissionId || typeof submissionId !== "string") {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  if (typeof listenDuration !== "number" || listenDuration < MIN_LISTEN_DURATION) {
    return NextResponse.json(
      { error: `Listen for at least ${MIN_LISTEN_DURATION} seconds before voting` },
      { status: 400 }
    );
  }

  try {
    // Check account age (must be at least 1 hour old)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const oneHour = 60 * 60 * 1000;
    if (accountAgeMs < oneHour) {
      return NextResponse.json(
        { error: "Your account is too new to vote. Try again in a bit!" },
        { status: 403 }
      );
    }

    // Get the submission
    const submission = await (prisma as any).chartSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, artistId: true, chartDate: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Can't vote for your own
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (artistProfile && submission.artistId === artistProfile.id) {
      return NextResponse.json(
        { error: "You can't vote for your own track" },
        { status: 403 }
      );
    }

    // Check chart date is today (can't vote on past charts)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const chartDate = new Date(submission.chartDate);
    if (chartDate.getTime() !== today.getTime()) {
      return NextResponse.json(
        { error: "Voting is only open for today's chart" },
        { status: 400 }
      );
    }

    // Check if already voted
    const existingVote = await (prisma as any).chartVote.findUnique({
      where: {
        submissionId_voterId: {
          submissionId,
          voterId: session.user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You've already voted for this track" },
        { status: 409 }
      );
    }

    // Check how many votes this user has already cast today (for credit cap)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    const DAILY_CREDIT_CAP = 5;
    const votesEarnedTodayCount = artistProfile
      ? await (prisma as any).chartVote.count({
          where: {
            voterId: session.user.id,
            createdAt: { gte: todayStart, lt: tomorrowStart },
          },
        })
      : DAILY_CREDIT_CAP; // no artist profile → skip credit

    const shouldAwardCredit = artistProfile !== null && votesEarnedTodayCount < DAILY_CREDIT_CAP;

    // Create vote, increment submission count, optionally award credit — all atomic
    const txOps: any[] = [
      (prisma as any).chartVote.create({
        data: {
          submissionId,
          voterId: session.user.id,
          listenDuration: Math.round(listenDuration),
        },
      }),
      (prisma as any).chartSubmission.update({
        where: { id: submissionId },
        data: { voteCount: { increment: 1 } },
      }),
    ];

    if (shouldAwardCredit) {
      txOps.push(
        prisma.artistProfile.update({
          where: { id: artistProfile!.id },
          data: {
            reviewCredits: { increment: 1 },
            totalCreditsEarned: { increment: 1 },
          },
        })
      );
    }

    await (prisma as any).$transaction(txOps);

    const votesLeftForCredits = shouldAwardCredit
      ? DAILY_CREDIT_CAP - (votesEarnedTodayCount + 1)
      : 0;

    return NextResponse.json({
      success: true,
      message: "Vote recorded!",
      creditEarned: shouldAwardCredit,
      votesLeftForCredits,
    });
  } catch (err: any) {
    console.error("Chart vote error:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "You've already voted for this track" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

/**
 * DELETE /api/charts/vote
 * Remove a vote from a chart submission.
 * Body: { submissionId: string }
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const submissionId = body?.submissionId;

  if (!submissionId || typeof submissionId !== "string") {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  try {
    const existingVote = await (prisma as any).chartVote.findUnique({
      where: {
        submissionId_voterId: {
          submissionId,
          voterId: session.user.id,
        },
      },
    });

    if (!existingVote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    await (prisma as any).$transaction([
      (prisma as any).chartVote.delete({
        where: { id: existingVote.id },
      }),
      (prisma as any).chartSubmission.update({
        where: { id: submissionId },
        data: { voteCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Vote removed" });
  } catch (err: any) {
    console.error("Chart unvote error:", err);
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 });
  }
}
