import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manualRenderProject } from "@/lib/ableton-render";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user?.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trigger the render
    await manualRenderProject(trackId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error triggering render:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger render" },
      { status: 500 }
    );
  }
}
