import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { sendEmailVerificationEmail } from "@/lib/email";
import { PASSWORD_REGEX } from "@/lib/password";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8).regex(PASSWORD_REGEX),
  artistName: z.string().min(1, "Artist name is required").max(100),
  genreIds: z.array(z.string()).min(1, "Select at least one genre").max(3),
});

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`signup:${clientIp}`, RATE_LIMITS.signup);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const data = schema.parse(body);

    const normalizedEmail = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: data.artistName,
          isArtist: true,
          isReviewer: false,
        },
        select: { id: true },
      });

      await tx.artistProfile.create({
        data: {
          userId: user.id,
          artistName: data.artistName,
          freeReviewCredits: 0,
          genres: {
            connect: data.genreIds.map((id) => ({ id })),
          },
        },
        select: { id: true },
      });

      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return { token };
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    const verifyUrl = `${baseUrl}/verify-email?token=${result.token}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      await sendEmailVerificationEmail({
        to: normalizedEmail,
        verifyUrl,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Get feedback create-account error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
