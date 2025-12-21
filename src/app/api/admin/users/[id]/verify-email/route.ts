import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await request.json().catch(() => ({}));

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    await prisma.user.update({
      where: { id },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin force verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify user" },
      { status: 500 }
    );
  }
}
