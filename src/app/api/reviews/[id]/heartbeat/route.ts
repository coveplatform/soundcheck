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

    await request.json().catch(() => ({}));

    const review = await prisma.review.findUnique({
      where: { id },
      include: { reviewer: { select: { userId: true } } },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.reviewer.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (review.status === "COMPLETED" || review.status === "EXPIRED" || review.status === "SKIPPED") {
      return NextResponse.json({ error: "Review is not active" }, { status: 400 });
    }

    const now = new Date();
    let deltaSeconds = 1;

    if (review.lastHeartbeat) {
      deltaSeconds = Math.floor((now.getTime() - review.lastHeartbeat.getTime()) / 1000);
      if (deltaSeconds < 0) deltaSeconds = 0;
      if (deltaSeconds > 10) deltaSeconds = 10;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        listenDuration: { increment: deltaSeconds },
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
