import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await request.json().catch(() => ({}));

    const { id } = await params;

    const track = await prisma.track.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.status === "CANCELLED") {
      return NextResponse.json({ success: true });
    }

    const startedReviews = await prisma.review.count({
      where: { trackId: track.id, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    });

    if (startedReviews > 0) {
      return NextResponse.json(
        { error: "Track cannot be cancelled once reviews have started" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.track.update({
        where: { id: track.id },
        data: { status: "CANCELLED" },
      }),
      prisma.reviewQueue.deleteMany({
        where: { trackId: track.id },
      }),
      prisma.review.updateMany({
        where: { trackId: track.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        data: { status: "EXPIRED" },
      }),
      ...(track.payment?.status === "PENDING"
        ? [
            prisma.payment.update({
              where: { id: track.payment.id },
              data: { status: "FAILED" },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin cancel track error:", error);
    return NextResponse.json(
      { error: "Failed to cancel track" },
      { status: 500 }
    );
  }
}
