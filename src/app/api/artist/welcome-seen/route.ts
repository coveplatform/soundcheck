import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to update the hasSeenWelcome field
    // If the field doesn't exist yet (before migration), this will fail silently
    try {
      await prisma.artistProfile.updateMany({
        where: { userId: session.user.id },
        data: { hasSeenWelcome: true } as any,
      });
    } catch (updateError) {
      // Field might not exist yet - that's okay, just log and continue
      console.log("Could not update hasSeenWelcome (field may not exist yet):", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking welcome as seen:", error);
    // Always return success to avoid blocking the user
    return NextResponse.json({ success: true });
  }
}
