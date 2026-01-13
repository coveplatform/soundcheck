import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// POST: Reset reminder flags so users become eligible again
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset trial users
    const trialResult = await prisma.user.updateMany({
      where: { trialReminderSentAt: { not: null } },
      data: { trialReminderSentAt: null }
    });

    // Reset leads
    const leadsResult = await prisma.leadCapture.updateMany({
      where: { reminded: true, converted: false },
      data: { reminded: false }
    });

    return NextResponse.json({
      success: true,
      trialUsersReset: trialResult.count,
      leadsReset: leadsResult.count,
    });
  } catch (error) {
    console.error("Reset reminders error:", error);
    return NextResponse.json(
      { error: "Failed to reset reminders" },
      { status: 500 }
    );
  }
}
