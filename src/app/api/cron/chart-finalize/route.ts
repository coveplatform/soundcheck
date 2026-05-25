import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEditorNoteForSubmission } from "@/lib/track-of-the-day/generate-editor-note";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;

  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;

  return false;
}

/**
 * POST /api/cron/chart-finalize
 * Run at midnight UTC to finalize yesterday's chart:
 * - Set rank on all submissions
 * - Mark #1 as isFeatured
 * Should be called by Vercel cron or manually.
 */
async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Yesterday's date
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const submissions = await (prisma as any).chartSubmission.findMany({
      where: { chartDate: yesterday },
      orderBy: [{ voteCount: "desc" }, { playCount: "desc" }, { createdAt: "asc" }],
    });

    if (submissions.length === 0) {
      return NextResponse.json({ success: true, message: "No submissions yesterday", ranked: 0 });
    }

    // Update ranks and mark winner
    const updates = submissions.map((sub: any, index: number) =>
      (prisma as any).chartSubmission.update({
        where: { id: sub.id },
        data: {
          rank: index + 1,
          isFeatured: index === 0,
        },
      })
    );

    await (prisma as any).$transaction(updates);

    // Generate AI editor's note for the winner (Bandcamp Daily-style blurb)
    const winner = submissions[0];
    let editorNoteStatus: "generated" | "skipped" | "failed" = "skipped";
    try {
      const note = await generateEditorNoteForSubmission(winner.id);
      await (prisma as any).chartSubmission.update({
        where: { id: winner.id },
        data: {
          editorNote: note,
          editorNoteByline: "MixReflect",
          editorNoteGeneratedAt: new Date(),
        },
      });
      editorNoteStatus = "generated";
    } catch (err) {
      console.error("[chart-finalize] Editor note generation failed:", err);
      editorNoteStatus = "failed";
    }

    return NextResponse.json({
      success: true,
      ranked: submissions.length,
      winner: {
        id: winner.id,
        title: winner.title,
        voteCount: winner.voteCount,
      },
      editorNote: editorNoteStatus,
    });
  } catch (error) {
    console.error("Chart finalize error:", error);
    return NextResponse.json({ error: "Failed to finalize chart" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
