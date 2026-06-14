import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from "@/lib/password";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
  acceptedTerms: z.boolean(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`signup:${clientIp}`, RATE_LIMITS.signup);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many signup attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
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
    const { email, password, acceptedTerms } = signupSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "You must agree to the Terms and Privacy Policy" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already in use. Try logging in instead." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role flags (auto-verified)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: new Date(),
        isArtist: true,
        isReviewer: true,
      },
    });

    // Welcome the new artist — fire-and-forget so a slow/failed email never
    // breaks signup. (Google sign-ups are welcomed via events.createUser in auth.ts.)
    void sendWelcomeEmail({ to: normalizedEmail, name: user.name }).catch((err) =>
      console.error("[signup] welcome email failed:", err)
    );

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: user.id,
        isArtist: user.isArtist,
        isReviewer: user.isReviewer,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
