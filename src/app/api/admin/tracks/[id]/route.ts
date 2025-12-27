import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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
