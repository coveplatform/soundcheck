import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`forgot-password:${clientIp}`, RATE_LIMITS.forgotPassword);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const { email } = schema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const emailConfigured = Boolean(
      process.env.RESEND_API_KEY &&
        (process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM)
    );

    if (process.env.NODE_ENV === "production" && !emailConfigured) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ success: true });
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    if (process.env.NODE_ENV !== "production" && !emailConfigured) {
      console.log("Dev password reset link:", resetUrl);
      return NextResponse.json({ success: true, resetUrl });
    }

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
