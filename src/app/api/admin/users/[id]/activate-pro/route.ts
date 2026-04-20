import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const PRO_MONTHLY_CREDITS = 20;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { ArtistProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.ArtistProfile) {
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
    }

    if (user.ArtistProfile.subscriptionStatus === "active") {
      return NextResponse.json({ error: "User already has Pro" }, { status: 400 });
    }

    await prisma.artistProfile.update({
      where: { id: user.ArtistProfile.id },
      data: {
        subscriptionStatus: "active",
        subscriptionCurrentPeriodStart: new Date(),
        reviewCredits: { increment: PRO_MONTHLY_CREDITS },
        totalCreditsEarned: { increment: PRO_MONTHLY_CREDITS },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin activate pro error:", error);
    return NextResponse.json({ error: "Failed to activate pro" }, { status: 500 });
  }
}
