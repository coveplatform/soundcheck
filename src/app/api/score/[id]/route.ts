import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/score/[id] — remove one of your own score reports.
 *
 * [id] = TrackScoreReport id. Deleting cascades its ScoreReview rows
 * (onDelete: Cascade), which also removes the track from every assigned
 * reviewer's queue. Ownership is by email or linked artist profile.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.trackScoreReport.findUnique({
    where: { id },
    select: { id: true, email: true, artistId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const ownsByEmail =
    !!report.email &&
    !!session.user.email &&
    report.email.toLowerCase() === session.user.email.toLowerCase();
  const ownsByArtist = !!report.artistId && !!profile && report.artistId === profile.id;
  if (!ownsByEmail && !ownsByArtist) {
    return NextResponse.json({ error: "Not your track" }, { status: 403 });
  }

  // Cascades the assigned ScoreReviews (and clears them from reviewers' queues).
  await prisma.trackScoreReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
