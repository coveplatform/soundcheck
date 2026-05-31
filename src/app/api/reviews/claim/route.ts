import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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

  // Daily review limit check (bypass for admin emails and Pro users)
  const BYPASS_LIMIT_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
  const bypassLimit =
    BYPASS_LIMIT_EMAILS.includes((session.user.email ?? "").toLowerCase()) ||
    artistProfile.subscriptionStatus === "active";

  if (!bypassLimit) {
    const MAX_REVIEWS_PER_DAY = 2;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const reviewsTodayCount = await prisma.review.count({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: "COMPLETED",
        updatedAt: { gte: startOfToday },
        // Secondary Compare tracks are auto-completed alongside the primary — don't double-count
        Track: { abTestPrimaryTrackId: null },
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
    const claimResult = await prisma.$transaction(async (tx) => {
      // Advisory lock on the track to prevent race conditions
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${trackId}))`;

      // One active review at a time — prevent claiming while another is in-flight
      const activeReview = await tx.review.findFirst({
        where: {
          peerReviewerArtistId: artistProfile.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        select: { id: true },
      });
      if (activeReview) {
        throw new Error(`ACTIVE_REVIEW:${activeReview.id}`);
      }

      const track = await tx.track.findUnique({
        where: { id: trackId },
        select: {
          id: true,
          status: true,
          artistId: true,
          packageType: true,
          reviewsRequested: true,
          isAbTest: true,
          abTestPrimaryTrackId: true,
          // Secondary AB track linked to this primary
          other_Track: {
            select: {
              id: true,
              status: true,
              reviewsRequested: true,
              artistId: true,
            },
          },
        },
      });

      if (!track) {
        throw new Error("Track not found");
      }

      // Prevent claiming Track B directly — always claim via Track A
      if (track.isAbTest && track.abTestPrimaryTrackId) {
        throw new Error("This track is part of an A/B test — claim the primary version instead");
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
        where: { trackId, peerReviewerArtistId: artistProfile.id },
        select: { id: true, status: true },
      });

      if (existingReview) {
        if (existingReview.status === "ASSIGNED" || existingReview.status === "IN_PROGRESS") {
          // Already claimed — find secondary review too if AB
          const secondaryReview = track.other_Track
            ? await tx.review.findFirst({
                where: { trackId: track.other_Track.id, peerReviewerArtistId: artistProfile.id },
                select: { id: true },
              })
            : null;
          return { reviewId: existingReview.id, secondaryReviewId: secondaryReview?.id ?? null };
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
        data: { trackId, artistReviewerId: artistProfile.id, expiresAt, priority: 0 },
      });

      if (track.status === "QUEUED") {
        await tx.track.update({ where: { id: trackId }, data: { status: "IN_PROGRESS" } });
      }

      // A/B: auto-create a linked review for Track B
      let secondaryReviewId: string | null = null;
      if (track.isAbTest && track.other_Track) {
        const secTrack = track.other_Track;

        // Only create if Track B is actually queued and needs reviews
        if (
          (secTrack.status === "QUEUED" || secTrack.status === "IN_PROGRESS") &&
          secTrack.reviewsRequested > 0
        ) {
          const [secCompleted, secActive] = await Promise.all([
            tx.review.count({ where: { trackId: secTrack.id, status: "COMPLETED", countsTowardCompletion: true } }),
            tx.review.count({ where: { trackId: secTrack.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }),
          ]);

          if (secCompleted + secActive < secTrack.reviewsRequested) {
            const secReview = await tx.review.create({
              data: {
                trackId: secTrack.id,
                peerReviewerArtistId: artistProfile.id,
                isPeerReview: true,
                status: "ASSIGNED",
              },
            });
            await tx.reviewQueue.create({
              data: { trackId: secTrack.id, artistReviewerId: artistProfile.id, expiresAt, priority: 0 },
            });
            if (secTrack.status === "QUEUED") {
              await tx.track.update({ where: { id: secTrack.id }, data: { status: "IN_PROGRESS" } });
            }
            secondaryReviewId = secReview.id;
          }
        }
      }

      return { reviewId: review.id, secondaryReviewId };
    });

    revalidateTag("sidebar", { expire: 0 });
    return NextResponse.json({ reviewId: claimResult.reviewId, secondaryReviewId: claimResult.secondaryReviewId });
  } catch (err: any) {
    const message = err?.message || "Failed to claim track";
    // Unique constraint violation — already claimed
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "You have already claimed this track" }, { status: 409 });
    }
    // Reviewer already has an active review in flight
    if (typeof message === "string" && message.startsWith("ACTIVE_REVIEW:")) {
      const activeReviewId = message.replace("ACTIVE_REVIEW:", "");
      return NextResponse.json({ error: "active_review", activeReviewId }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
