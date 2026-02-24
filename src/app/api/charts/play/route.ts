import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/charts/play
 * Increment play count for a chart submission.
 * Body: { submissionId: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const submissionId = body?.submissionId;

  if (!submissionId || typeof submissionId !== "string") {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  try {
    await (prisma as any).chartSubmission.update({
      where: { id: submissionId },
      data: { playCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Chart play error:", err);
    return NextResponse.json({ error: "Failed to record play" }, { status: 500 });
  }
}
