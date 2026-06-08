import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Open opt-in: any logged-in user can become a score reviewer with one click.
 * (No approval step — that was the product decision.)
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { isScoreReviewer: true },
  });

  return NextResponse.json({ ok: true });
}
