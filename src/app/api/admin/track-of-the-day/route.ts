import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEditorNoteForSubmission } from "@/lib/track-of-the-day/generate-editor-note";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return null;
  }
  return session;
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { submissionId, editorNote, editorNoteByline } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    await (prisma as any).chartSubmission.update({
      where: { id: submissionId },
      data: {
        ...(editorNote !== undefined && { editorNote }),
        ...(editorNoteByline !== undefined && { editorNoteByline }),
        editorNoteEditedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/track-of-the-day PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { submissionId, action } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    if (action === "regenerate") {
      const note = await generateEditorNoteForSubmission(submissionId);
      await (prisma as any).chartSubmission.update({
        where: { id: submissionId },
        data: {
          editorNote: note,
          editorNoteGeneratedAt: new Date(),
          editorNoteEditedAt: null,
        },
      });
      return NextResponse.json({ success: true, editorNote: note });
    }

    if (action === "feature") {
      // Allow admin to manually pick a different winner — unfeature current, feature this
      const submission = await (prisma as any).chartSubmission.findUnique({
        where: { id: submissionId },
      });
      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }
      await (prisma as any).chartSubmission.updateMany({
        where: { chartDate: submission.chartDate, isFeatured: true },
        data: { isFeatured: false },
      });
      await (prisma as any).chartSubmission.update({
        where: { id: submissionId },
        data: { isFeatured: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/track-of-the-day POST]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
