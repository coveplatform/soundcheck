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

    await prisma.artistProfile.updateMany({
      where: { userId: session.user.id },
      data: { hasSeenWelcome: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking welcome as seen:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
