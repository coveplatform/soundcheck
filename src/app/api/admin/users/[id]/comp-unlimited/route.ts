import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { activateSubscriber } from "@/lib/score-subscription";

/**
 * Comp / revoke an Unlimited (score) subscription for a user's email.
 * Activating back-unlocks all their gated reports (via activateSubscriber).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action === "deactivate" ? "deactivate" : "activate";

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const email = user.email.trim().toLowerCase();

    if (action === "activate") {
      await activateSubscriber({ email });
    } else {
      // Revoke comp: flip to inactive. Already-unlocked reports stay unlocked.
      await prisma.scoreSubscriber.updateMany({
        where: { email },
        data: { status: "inactive" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin comp-unlimited error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
