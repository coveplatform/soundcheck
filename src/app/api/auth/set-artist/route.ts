import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// This endpoint marks the current user as an artist
// Used when Google OAuth users sign up via the TikTok landing page
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user to be an artist
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isArtist: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting artist flag:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
