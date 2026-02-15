import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from "@/lib/password";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { createReferralCoupon, generateReferralCode } from "@/lib/referral-system";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
  acceptedTerms: z.boolean(),
  referralSource: z.string().optional(),
  referralCode: z.string().optional(), // Referral code from ?ref= parameter
  // Note: 'role' field removed - everyone is both artist and reviewer in unified model
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
    const { email, password, acceptedTerms, referralSource, referralCode } = signupSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "You must agree to the Terms and Privacy Policy" },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let validReferralCode: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
        select: { id: true },
      });

      if (referrer) {
        validReferralCode = referralCode.toUpperCase();
      }
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

    // Generate referral code for new user
    const newUserReferralCode = await generateReferralCode(normalizedEmail.split("@")[0], "temp");

    // Create user with role flags (auto-verified)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: new Date(),
        isArtist: true,
        isReviewer: true, // All users can review via peer system
        referralSource,
        referredByCode: validReferralCode,
        referralCode: newUserReferralCode,
      },
    });

    // Create $5 off coupon for new user if they used a referral code
    let couponId: string | undefined;
    if (validReferralCode) {
      try {
        couponId = await createReferralCoupon(user.id, normalizedEmail.split("@")[0]);
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCouponId: couponId },
        });
      } catch (error) {
        console.error("Failed to create referral coupon:", error);
      }
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: user.id,
        isArtist: user.isArtist,
        isReviewer: user.isReviewer,
        hasReferralDiscount: !!couponId,
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
