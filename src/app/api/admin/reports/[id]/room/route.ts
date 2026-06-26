import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Hide a score report from the human review room (or restore it).
//
// Hiding sets humanRoomSkipped, which pulls the report from the reviewer queue
// and blocks new claims (see getScoreReviewQueue / claimScoreReviewSeat in
// score-review.ts), and expires any outstanding ASSIGNED/IN_PROGRESS
// assignments so in-flight reviewers can't submit either — i.e. no one else
// can review it. The AI verdict, score and the owner's report are untouched.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { skip?: boolean };
    const skip = body.skip !== false; // default to hiding

    const report = await prisma.trackScoreReport.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.trackScoreReport.update({
        where: { id },
        data: { humanRoomSkipped: skip },
      }),
      // When hiding, expire outstanding assignments so in-flight reviewers drop
      // it too. Restoring just reopens the queue; it doesn't un-expire.
      ...(skip
        ? [
            prisma.scoreReview.updateMany({
              where: { reportId: id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
              data: { status: "EXPIRED" },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, skipped: skip });
  } catch (error) {
    console.error("Admin toggle report room error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
