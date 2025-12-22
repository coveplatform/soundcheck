import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user?.email || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmailVerificationEmail({
      to: user.email,
      verifyUrl,
    });

    const emailConfigured = Boolean(
      process.env.RESEND_API_KEY && (process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM)
    );

    if (process.env.NODE_ENV !== "production" && !emailConfigured) {
      console.log("Dev email verification link:", verifyUrl);
    }

    return NextResponse.json({
      success: true,
      ...(process.env.NODE_ENV !== "production" && !emailConfigured
        ? { verifyUrl }
        : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification" },
      { status: 500 }
    );
  }
}
