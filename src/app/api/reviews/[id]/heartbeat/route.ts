import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_LISTEN_SECONDS = 180;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const clientListenTime = typeof body?.clientListenTime === "number" ? body.clientListenTime : null;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        ReviewerProfile: { select: { userId: true, isRestricted: true } },
        ArtistProfile: { select: { userId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Ownership check: peer review uses ArtistProfile, legacy uses ReviewerProfile
    const isPeer = review.isPeerReview || !!review.peerReviewerArtistId;
    const isOwner = isPeer
      ? review.ArtistProfile?.userId === session.user.id
      : review.ReviewerProfile?.userId === session.user.id;

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.ReviewerProfile?.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (review.status === "COMPLETED" || review.status === "EXPIRED" || review.status === "SKIPPED") {
      return NextResponse.json({ error: "Review is not active" }, { status: 400 });
    }

    const now = new Date();
    let newListenDuration: number;

    if (clientListenTime !== null && clientListenTime > review.listenDuration) {
      // Client is providing its listen time for sync (e.g. before submission).
      // Trust it, but cap at current + 60s to prevent abuse.
      const maxAllowed = review.listenDuration + 60;
      newListenDuration = Math.min(clientListenTime, maxAllowed);
    } else {
      // Normal heartbeat: increment by time since last heartbeat (capped at 10s)
      let deltaSeconds = 1;
      if (review.lastHeartbeat) {
        deltaSeconds = Math.floor((now.getTime() - review.lastHeartbeat.getTime()) / 1000);
        if (deltaSeconds < 0) deltaSeconds = 0;
        if (deltaSeconds > 10) deltaSeconds = 10;
      }
      newListenDuration = review.listenDuration + deltaSeconds;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        listenDuration: newListenDuration,
        lastHeartbeat: now,
        ...(review.status === "ASSIGNED" ? { status: "IN_PROGRESS" } : {}),
      },
      select: { listenDuration: true, status: true },
    });

    return NextResponse.json({
      success: true,
      listenDuration: updated.listenDuration,
      status: updated.status,
      minimumReached: updated.listenDuration >= MIN_LISTEN_SECONDS,
      minimumListenSeconds: MIN_LISTEN_SECONDS,
    });
  } catch (error) {
    console.error("Error in heartbeat:", error);
    return NextResponse.json({ error: "Failed to record heartbeat" }, { status: 500 });
  }
}
