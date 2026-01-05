import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { sendFinishLaterEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  source: z.string().max(50).default("get-feedback"),
});

export async function POST(request: Request) {
  try {
    // Rate limit to prevent spam
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`lead:${clientIp}`, RATE_LIMITS.signup);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = schema.parse(body);
    const normalizedEmail = data.email.trim().toLowerCase();

    const leadCapture = (prisma as any).leadCapture as any;

    // Check if this email was already captured
    const existing = await leadCapture.findFirst({
      where: { email: normalizedEmail, source: data.source },
    });

    if (existing) {
      // Already captured - just return success
      return NextResponse.json({ success: true, message: "already_captured" });
    }

    // Check if they already have an account
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (existingUser) {
      return NextResponse.json({ success: true, message: "has_account" });
    }

    // Create lead capture
    await leadCapture.create({
      data: {
        email: normalizedEmail,
        source: data.source,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;

    try {
      await sendFinishLaterEmail({
        to: normalizedEmail,
        resumeUrl: `${baseUrl}/get-feedback`,
      });
    } catch (emailError) {
      console.error("Lead capture finish-later email error:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
