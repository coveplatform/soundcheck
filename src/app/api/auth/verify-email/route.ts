import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = schema.parse(body);

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification link is invalid or expired" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
