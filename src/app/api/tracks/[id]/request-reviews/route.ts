import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { TrackStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { hasAvailableSlot, ACTIVE_TRACK_STATUSES } from "@/lib/slots";
import { detectSource } from "@/lib/metadata";

const requestSchema = z.object({
  desiredReviews: z.number().int().min(1).max(10),
  // Optional: attach a new secondary track to turn this into a Compare pair
  compareSecondary: z.object({
    sourceUrl: z.string().min(1),
    sourceType: z.enum(["SOUNDCLOUD", "BANDCAMP", "YOUTUBE", "UPLOAD"]).optional(),
    title: z.string().min(1).max(200),
    artworkUrl: z.string().url().optional().nullable(),
  }).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = requestSchema.parse(body);

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        ArtistProfile: {
          select: {
            userId: true,
            subscriptionStatus: true,
            reviewCredits: true,
          }
        },
        Review: { select: { id: true } },
        Genre: { select: { id: true } },
        // Secondary AB track — queued alongside the primary at no extra credit cost
        other_Track: { select: { id: true, status: true, reviewsRequested: true, Review: { select: { id: true } } } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (track.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cancelled tracks cannot be updated" },
        { status: 400 }
      );
    }

    // Allow requesting more reviews on tracks that are UPLOADED, COMPLETED, or IN_PROGRESS
    const eligibleStatuses = ["UPLOADED", "PENDING_PAYMENT", "COMPLETED", "IN_PROGRESS", "QUEUED"];
    if (!eligibleStatuses.includes(track.status)) {
      return NextResponse.json(
        { error: "Track is not eligible for requesting reviews" },
        { status: 400 }
      );
    }

    const isPro = track.ArtistProfile.subscriptionStatus === "active";

    // Slot enforcement: if this track isn't already active, it will occupy a new slot
    const isAlreadyActive = (ACTIVE_TRACK_STATUSES as readonly string[]).includes(track.status);
    if (!isAlreadyActive) {
      const slotCheck = await hasAvailableSlot(track.artistId, isPro);
      if (!slotCheck.available) {
        return NextResponse.json(
          {
            error: "All your review slots are in use. Wait for current reviews to complete, or upgrade to Pro for more slots.",
            activeCount: slotCheck.activeCount,
            maxSlots: slotCheck.maxSlots,
          },
          { status: 409 }
        );
      }
    }

    const desired = data.desiredReviews;

    // Determine if this request is creating a new Compare pair from an existing single track
    const isNewCompare = !!data.compareSecondary && !track.isAbTest;

    // Validate Version B source type if creating a new compare pair
    let secondarySourceType: string | null = null;
    if (isNewCompare && data.compareSecondary) {
      const sec = data.compareSecondary;
      if (sec.sourceType === "UPLOAD") {
        secondarySourceType = "UPLOAD";
      } else {
        secondarySourceType = sec.sourceType ?? detectSource(sec.sourceUrl);
        if (!secondarySourceType) {
          return NextResponse.json(
            { error: "Invalid Version B URL. Use SoundCloud, Bandcamp, or YouTube" },
            { status: 400 }
          );
        }
      }
    }

    const isABPrimary = (track.isAbTest && !!track.other_Track) || isNewCompare;
    // A/B test costs 2 credits per reviewer — each reviewer listens to both tracks
    const cost = isABPrimary ? desired * 2 : desired;

    if ((track.ArtistProfile.reviewCredits ?? 0) < cost) {
      return NextResponse.json(
        { error: "Not enough credits. Earn more by reviewing tracks or upgrade to Pro." },
        { status: 403 }
      );
    }

    // Determine new status before transaction to minimise work inside it
    const hasExistingReviews = track.Review.length > 0;
    const currentReviewsRequested = track.reviewsRequested ?? 0;
    const newReviewsRequested = currentReviewsRequested + desired;
    const newStatus = hasExistingReviews ? "IN_PROGRESS" : "QUEUED";

    const existingSecondaryTrack = track.other_Track ?? null;

    await prisma.$transaction(async (tx) => {
      // Decrement credits atomically
      await tx.artistProfile.updateMany({
        where: {
          id: track.artistId,
          reviewCredits: { gte: cost },
        },
        data: {
          reviewCredits: { decrement: cost },
          totalCreditsSpent: { increment: cost },
          ...(!hasExistingReviews && { totalTracks: { increment: 1 } }),
        },
      });

      // Update Track A
      await tx.track.update({
        where: { id: track.id },
        data: {
          packageType: hasExistingReviews ? track.packageType : "PEER",
          reviewsRequested: newReviewsRequested,
          creditsSpent: { increment: cost },
          status: newStatus,
          paidAt: track.paidAt ?? new Date(),
          completedAt: null,
          // Mark as AB test when creating a new compare pair
          ...(isNewCompare && { isAbTest: true }),
        },
      });

      if (isNewCompare && data.compareSecondary && secondarySourceType) {
        // Create Track B linked to Track A
        const sec = data.compareSecondary;
        await tx.track.create({
          data: {
            artistId: track.artistId,
            sourceUrl: sec.sourceUrl,
            sourceType: secondarySourceType as any,
            title: sec.title,
            artworkUrl: sec.artworkUrl ?? null,
            feedbackFocus: track.feedbackFocus,
            feedbackAreas: track.feedbackAreas ?? [],
            isPublic: false,
            packageType: "PEER",
            reviewsRequested: desired,
            creditsSpent: 0,
            status: TrackStatus.QUEUED,
            allowPurchase: false,
            isAbTest: true,
            abTestPrimaryTrackId: track.id,
            paidAt: new Date(),
            ...(track.Genre?.length ? {
              Genre: { connect: track.Genre.map((g: { id: string }) => ({ id: g.id })) },
            } : {}),
          },
        });
      } else if (isABPrimary && existingSecondaryTrack) {
        // Mirror reviewsRequested to existing Track B — no extra credits charged
        await tx.track.update({
          where: { id: existingSecondaryTrack.id },
          data: {
            packageType: "PEER",
            reviewsRequested: (existingSecondaryTrack.reviewsRequested ?? 0) + desired,
            status: existingSecondaryTrack.Review.length > 0 ? "IN_PROGRESS" : "QUEUED",
            paidAt: track.paidAt ?? new Date(),
            completedAt: null,
          },
        });
      }
    });

    await assignReviewersToTrack(track.id);
    // Track B doesn't need independent assignment — reviewers are assigned via Track A claim
    revalidateTag("sidebar", { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "TRACK_NOT_ELIGIBLE") {
      return NextResponse.json(
        { error: "Track is not eligible for requesting reviews" },
        { status: 400 }
      );
    }

    console.error("Request reviews error:", error);
    return NextResponse.json(
      { error: "Failed to request reviews" },
      { status: 500 }
    );
  }
}
