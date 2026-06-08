import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/** Toggle a user's score-reviewer membership. Admin only. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { userId, isReviewer } = (body ?? {}) as {
    userId?: string;
    isReviewer?: boolean;
  };
  if (!userId || typeof isReviewer !== "boolean") {
    return NextResponse.json({ error: "userId and isReviewer required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isScoreReviewer: isReviewer },
  });

  return NextResponse.json({ ok: true });
}
