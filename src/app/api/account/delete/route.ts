import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const artist = await prisma.artistProfile.findUnique({
      where: { userId },
      select: { id: true, totalSpent: true },
    });

    if (artist && artist.totalSpent > 0) {
      return NextResponse.json(
        { error: "Your account has purchase history. Please contact support to delete your account." },
        { status: 400 }
      );
    }

    const reviewer = await prisma.listenerProfile.findUnique({
      where: { userId },
      select: { id: true, pendingBalance: true },
    });

    if (reviewer) {
      if (reviewer.pendingBalance > 0) {
        return NextResponse.json(
          { error: "You have a remaining balance. Please contact support to delete your account." },
          { status: 400 }
        );
      }

      const payoutCount = await prisma.payout.count({
        where: { reviewerId: reviewer.id },
      });

      if (payoutCount > 0) {
        return NextResponse.json(
          { error: "Your account has payout history. Please contact support to delete your account." },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
