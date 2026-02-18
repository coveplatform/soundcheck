import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reviews/claim
 * Claim a track for peer review. Creates Review + ReviewQueue atomically.
 * Body: { trackId: string }
 * Returns: { reviewId: string }
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

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, completedOnboarding: true, peerFlagCount: true, subscriptionStatus: true },
  });

  if (!artistProfile) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
  }

  if (!artistProfile.completedOnboarding) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
  }

  // Daily review limit check (bypass for admin emails only)
  const BYPASS_LIMIT_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
  const bypassLimit = BYPASS_LIMIT_EMAILS.includes((session.user.email ?? "").toLowerCase());

  if (!bypassLimit) {
    const MAX_REVIEWS_PER_DAY = 2;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const reviewsTodayCount = await prisma.review.count({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: "COMPLETED",
        updatedAt: { gte: startOfToday },
      },
    });

    if (reviewsTodayCount >= MAX_REVIEWS_PER_DAY) {
      return NextResponse.json(
        { error: "You've reached your daily limit of 2 reviews. Check back tomorrow!" },
        { status: 429 }
      );
    }
  }

  try {
    const reviewId = await prisma.$transaction(async (tx) => {
      // Advisory lock on the track to prevent race conditions
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${trackId}))`;

      const track = await tx.track.findUnique({
        where: { id: trackId },
        select: {
          id: true,
          status: true,
          artistId: true,
          packageType: true,
          reviewsRequested: true,
        },
      });

      if (!track) {
        throw new Error("Track not found");
      }

      if (track.status !== "QUEUED" && track.status !== "IN_PROGRESS") {
        throw new Error("Track is no longer available for review");
      }

      if (track.packageType !== "PEER") {
        throw new Error("Track is not available for peer review");
      }

      // Can't review your own track
      if (track.artistId === artistProfile.id) {
        throw new Error("You cannot review your own track");
      }

      // Check if user already has a review for this track (any status)
      const existingReview = await tx.review.findFirst({
        where: {
          trackId,
          peerReviewerArtistId: artistProfile.id,
        },
        select: { id: true, status: true },
      });

      if (existingReview) {
        if (existingReview.status === "ASSIGNED" || existingReview.status === "IN_PROGRESS") {
          // Already claimed — return existing review
          return existingReview.id;
        }
        throw new Error("You have already reviewed or skipped this track");
      }

      // Count active + completed reviews to check if track still needs more
      const [completedCount, activeCount] = await Promise.all([
        tx.review.count({ where: { trackId, status: "COMPLETED", countsTowardCompletion: true } }),
        tx.review.count({ where: { trackId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }),
      ]);

      if (completedCount + activeCount >= track.reviewsRequested) {
        throw new Error("This track already has enough reviewers");
      }

      // Create the review and queue entry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const review = await tx.review.create({
        data: {
          trackId,
          peerReviewerArtistId: artistProfile.id,
          isPeerReview: true,
          status: "ASSIGNED",
        },
      });

      await tx.reviewQueue.create({
        data: {
          trackId,
          artistReviewerId: artistProfile.id,
          expiresAt,
          priority: 0,
        },
      });

      // Update track status to IN_PROGRESS if it was QUEUED
      if (track.status === "QUEUED") {
        await tx.track.update({
          where: { id: trackId },
          data: { status: "IN_PROGRESS" },
        });
      }

      return review.id;
    });

    return NextResponse.json({ reviewId });
  } catch (err: any) {
    const message = err?.message || "Failed to claim track";
    // Unique constraint violation — already claimed
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "You have already claimed this track" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
