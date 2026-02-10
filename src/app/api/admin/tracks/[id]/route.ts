import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { assignReviewersToTrack, getEligibleReviewers, TEST_REVIEWER_EMAILS } from "@/lib/queue";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Delete in order to respect foreign key constraints
    await prisma.$transaction([
      // Delete reviews for this track
      prisma.review.deleteMany({
        where: { trackId },
      }),
      // Delete queue entries for this track
      prisma.reviewQueue.deleteMany({
        where: { trackId },
      }),
      // Delete payment records for this track
      prisma.payment.deleteMany({
        where: { trackId },
      }),
      // Delete the track itself
      prisma.track.delete({
        where: { id: trackId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete track error:", error);
    return NextResponse.json(
      { error: "Failed to delete track" },
      { status: 500 }
    );
  }
}

// Debug endpoint to check eligible reviewers and manually trigger assignment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        genres: true,
        reviews: { select: { reviewerId: true, status: true } },
        queueEntries: { select: { reviewerId: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Get all reviewers to show why they might not be eligible
    const allReviewers = await prisma.reviewerProfile.findMany({
      include: {
        genres: true,
        User: { select: { email: true, createdAt: true } },
      },
    });

    const eligibleReviewers = await getEligibleReviewers(trackId, track.packageType);

    // Build debug info for each reviewer
    const reviewerDebug = allReviewers.map((r) => {
      const reasons: string[] = [];

      const reviewerEmail = (r.User.email ?? "").trim().toLowerCase();
      const isTestBypass = TEST_REVIEWER_EMAILS.includes(reviewerEmail);

      if (!r.completedOnboarding) reasons.push("onboarding not completed");
      if (!r.onboardingQuizPassed) reasons.push("quiz not passed");
      if (r.isRestricted) reasons.push("restricted");

      if (!isTestBypass) {
        const hoursSinceCreation =
          (Date.now() - new Date(r.User.createdAt).getTime()) / (1000 * 60 * 60);
        const minAge = Number(process.env.MIN_REVIEWER_ACCOUNT_AGE_HOURS ?? "24");
        if (hoursSinceCreation < minAge) {
          reasons.push(`account too new (${Math.round(hoursSinceCreation)}h < ${minAge}h)`);
        }
      }

      const trackGenreSlugs = track.genres.map(g => g.slug);
      const reviewerGenreSlugs = r.genres.map(g => g.slug);
      if (!isTestBypass) {
        const hasGenreMatch = trackGenreSlugs.some(tg => reviewerGenreSlugs.includes(tg));
        if (!hasGenreMatch) {
          reasons.push(
            `no genre match (track: ${trackGenreSlugs.join(", ")} | reviewer: ${reviewerGenreSlugs.join(", ")})`
          );
        }
      }

      const hasExistingReview = track.reviews.some(rev => rev.reviewerId === r.id);
      if (hasExistingReview) reasons.push("already has review entry for this track");

      const hasQueueEntry = track.queueEntries.some(q => q.reviewerId === r.id);
      if (hasQueueEntry) reasons.push("already in queue for this track");

      const isEligible = eligibleReviewers.some(e => e.id === r.id);

      return {
        email: r.User.email,
        tier: r.tier,
        isEligible,
        reasons: reasons.length > 0 ? reasons : ["eligible"],
      };
    });

    // Attempt assignment
    await assignReviewersToTrack(trackId);

    // Get updated state
    const updatedTrack = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        reviews: { select: { reviewerId: true, status: true } },
        queueEntries: {
          include: { reviewer: { include: { User: { select: { email: true } } } } }
        },
      },
    });

    return NextResponse.json({
      track: {
        id: track.id,
        status: track.status,
        genres: track.genres.map(g => g.name),
        reviewsRequested: track.reviewsRequested,
      },
      eligibleCount: eligibleReviewers.length,
      reviewerDebug,
      afterAssignment: {
        queueEntries: updatedTrack?.queueEntries.map(q => q.reviewer.User.email) ?? [],
        reviews: updatedTrack?.reviews ?? [],
      },
    });
  } catch (error) {
    console.error("Debug assign error:", error);
    return NextResponse.json(
      { error: "Failed to debug assignment" },
      { status: 500 }
    );
  }
}
