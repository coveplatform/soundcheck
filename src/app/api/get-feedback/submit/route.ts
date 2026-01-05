import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { sendEmailVerificationEmail, sendAdminNewTrackNotification } from "@/lib/email";
import { PASSWORD_REGEX } from "@/lib/password";
import { detectSource, PACKAGES, PackageType, TrackSource } from "@/lib/metadata";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { assignReviewersToTrack } from "@/lib/queue";

export const runtime = "nodejs";

// Schema for new users
const newUserSchema = z.object({
  // Track info
  sourceUrl: z.string().min(1, "Track source is required"),
  sourceType: z.enum(["SOUNDCLOUD", "BANDCAMP", "YOUTUBE", "UPLOAD"]),
  title: z.string().min(1, "Title is required").max(200),
  artworkUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().max(60 * 60).optional().nullable(),
  genreIds: z.array(z.string()).min(1, "Select at least one genre").max(3),
  feedbackFocus: z.string().max(1000).optional(),
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE"]),

  // Account info (required for new users)
  email: z.string().email("Invalid email address"),
  password: z.string().min(8).regex(PASSWORD_REGEX),
  artistName: z.string().min(1, "Artist name is required").max(100),
});

// Schema for logged-in users
const loggedInSchema = z.object({
  // Track info
  sourceUrl: z.string().min(1, "Track source is required"),
  sourceType: z.enum(["SOUNDCLOUD", "BANDCAMP", "YOUTUBE", "UPLOAD"]),
  title: z.string().min(1, "Title is required").max(200),
  artworkUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().max(60 * 60).optional().nullable(),
  genreIds: z.array(z.string()).min(1, "Select at least one genre").max(3),
  feedbackFocus: z.string().max(1000).optional(),
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE"]),
  // Optional artist name for users without a profile
  artistName: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session?.user?.id;

    const body = await request.json();

    if (isLoggedIn) {
      // Logged-in user flow
      const data = loggedInSchema.parse(body);

      // Get or create artist profile
      let artistProfile = await prisma.artistProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!artistProfile) {
        // Create profile with genres from the track
        // Use provided artistName, fall back to user name, then "Artist"
        const profileName = data.artistName?.trim() || session.user.name || "Artist";
        artistProfile = await prisma.artistProfile.create({
          data: {
            userId: session.user.id,
            artistName: profileName,
            genres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // Update user to mark as artist
        await prisma.user.update({
          where: { id: session.user.id },
          data: { isArtist: true },
        });
      }

      // Determine source type
      let sourceType: TrackSource = data.sourceType;
      if (sourceType === "UPLOAD") {
        const isLocalUpload = data.sourceUrl.startsWith("/uploads/");
        let isRemoteUpload = false;
        if (!isLocalUpload) {
          try {
            const parsed = new URL(data.sourceUrl);
            isRemoteUpload = parsed.protocol === "https:" || parsed.protocol === "http:";
          } catch {
            isRemoteUpload = false;
          }
        }
        if (!isLocalUpload && !isRemoteUpload) {
          return NextResponse.json({ error: "Invalid upload URL" }, { status: 400 });
        }
      } else {
        const detected = detectSource(data.sourceUrl);
        if (detected) {
          sourceType = detected;
        }
      }

      // Get package details
      const packageDetails = PACKAGES[data.packageType];

      // Create track
      const track = await prisma.track.create({
        data: {
          artistId: artistProfile.id,
          sourceUrl: data.sourceUrl,
          sourceType,
          title: data.title,
          artworkUrl: data.artworkUrl,
          duration: data.duration,
          feedbackFocus: data.feedbackFocus,
          packageType: data.packageType,
          reviewsRequested: packageDetails.reviews,
          genres: {
            connect: data.genreIds.map((id) => ({ id })),
          },
        },
      });

      const checkoutUrl = `/artist/submit/checkout?trackId=${track.id}`;

      // Best-effort: mark lead as converted (if we have an email)
      const sessionEmail = (session?.user as { email?: string } | undefined)?.email;
      if (sessionEmail) {
        try {
          const normalizedEmail = sessionEmail.trim().toLowerCase();
          const leadCapture = (prisma as any).leadCapture as any;
          await leadCapture.updateMany({
            where: { email: normalizedEmail, source: "get-feedback" },
            data: { converted: true },
          });
        } catch {
          // Best-effort only
        }
      }

      return NextResponse.json({
        success: true,
        trackId: track.id,
        checkoutUrl,
        signIn: false,
      });
    } else {
      // New user flow - rate limit
      const clientIp = getClientIp(request);
      const rateLimit = await checkRateLimit(`signup:${clientIp}`, RATE_LIMITS.signup);

      if (!rateLimit.success) {
        return NextResponse.json(
          { error: `Too many attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
          { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
        );
      }

      const data = newUserSchema.parse(body);
      const normalizedEmail = data.email.trim().toLowerCase();

      // Best-effort: mark lead as converted
      {
        try {
          const leadCapture = (prisma as any).leadCapture as any;
          await leadCapture.updateMany({
            where: { email: normalizedEmail, source: "get-feedback" },
            data: { converted: true },
          });
        } catch {
          // Best-effort only
        }
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }

      // Determine source type
      let sourceType: TrackSource = data.sourceType;
      if (sourceType === "UPLOAD") {
        const isLocalUpload = data.sourceUrl.startsWith("/uploads/");
        let isRemoteUpload = false;
        if (!isLocalUpload) {
          try {
            const parsed = new URL(data.sourceUrl);
            isRemoteUpload = parsed.protocol === "https:" || parsed.protocol === "http:";
          } catch {
            isRemoteUpload = false;
          }
        }
        if (!isLocalUpload && !isRemoteUpload) {
          return NextResponse.json({ error: "Invalid upload URL" }, { status: 400 });
        }
      } else {
        const detected = detectSource(data.sourceUrl);
        if (detected) {
          sourceType = detected;
        }
      }

      // Get package details
      const packageDetails = PACKAGES[data.packageType];

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create user
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: data.artistName,
            isArtist: true,
            isReviewer: false,
          },
        });

        // 2. Create artist profile (no free credit - they go through paid checkout)
        const artistProfile = await tx.artistProfile.create({
          data: {
            userId: user.id,
            artistName: data.artistName,
            freeReviewCredits: 0,
            genres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // 3. Create track
        const track = await tx.track.create({
          data: {
            artistId: artistProfile.id,
            sourceUrl: data.sourceUrl,
            sourceType,
            title: data.title,
            artworkUrl: data.artworkUrl,
            duration: data.duration,
            feedbackFocus: data.feedbackFocus,
            packageType: data.packageType,
            reviewsRequested: packageDetails.reviews,
            genres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // 4. Create email verification token
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

        return { user, artistProfile, track, verificationToken: token };
      });

      // Send verification email (outside transaction)
      const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
      const verifyUrl = `${baseUrl}/verify-email?token=${result.verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

      try {
        await sendEmailVerificationEmail({
          to: normalizedEmail,
          verifyUrl,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail the request if email fails - they can resend
      }

      const checkoutUrl = `/artist/submit/checkout?trackId=${result.track.id}`;

      return NextResponse.json({
        success: true,
        trackId: result.track.id,
        checkoutUrl,
        signIn: true, // Tell client to sign in
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Get feedback submit error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
