import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPendingRenders, getCompletedRenders } from "@/lib/ableton-render";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    // Simple admin check - you can enhance this with a proper admin role
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user?.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (status === "completed") {
      const renders = await getCompletedRenders();
      return NextResponse.json(renders);
    }

    const renders = await getPendingRenders();
    return NextResponse.json(renders);
  } catch (error) {
    console.error("Error fetching renders:", error);
    return NextResponse.json(
      { error: "Failed to fetch renders" },
      { status: 500 }
    );
  }
}
