import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { getEligibleReviewers } from "@/lib/queue";

export async function GET(
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

    const eligibleReviewers = await getEligibleReviewers(trackId, track.packageType);

    return NextResponse.json({
      reviewers: eligibleReviewers.map((r) => ({
        id: r.id,
        email: r.user.email,
        tier: r.tier,
      })),
    });
  } catch (error) {
    console.error("Get eligible reviewers error:", error);
    return NextResponse.json(
      { error: "Failed to get eligible reviewers" },
      { status: 500 }
    );
  }
}
