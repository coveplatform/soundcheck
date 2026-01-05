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

    const markLeadConverted = async (normalizedEmail: string) => {
      try {
        const leadCapture = (prisma as any).leadCapture as any;
        await leadCapture.updateMany({
          where: { email: normalizedEmail, source: "get-feedback" },
          data: { converted: true },
        });
      } catch {
        // Best-effort only
      }
    };

    if (isLoggedIn) {
      // Logged-in user flow
      const data = loggedInSchema.parse(body);

      // Get or create artist profile
      let artistProfile = await prisma.artistProfile.findUnique({
        where: { userId: session.user.id },
      });

      const isNewArtistProfile = !artistProfile;

      if (!artistProfile) {
        // Create profile with genres from the track and 1 free review credit
        // Use provided artistName, fall back to user name, then "Artist"
        const profileName = data.artistName?.trim() || session.user.name || "Artist";
        artistProfile = await prisma.artistProfile.create({
          data: {
            userId: session.user.id,
            artistName: profileName,
            freeReviewCredits: 1, // New users get 1 free review
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

      // Check if user has free review credits (new user gets their first review free)
      const hasFreeCredit = artistProfile.freeReviewCredits > 0;

      if (hasFreeCredit) {
        // Use free credit - no payment needed
        const paidAt = new Date();
        const track = await prisma.track.create({
          data: {
            artistId: artistProfile.id,
            sourceUrl: data.sourceUrl,
            sourceType,
            title: data.title,
            artworkUrl: data.artworkUrl,
            duration: data.duration,
            feedbackFocus: data.feedbackFocus,
            packageType: "STARTER",
            reviewsRequested: 1,
            status: "QUEUED",
            paidAt,
            promoCode: "FREE_FIRST_REVIEW",
            genres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // Create $0 payment record
        await prisma.payment.create({
          data: {
            trackId: track.id,
            amount: 0,
            stripeSessionId: `free_first_review_${track.id}_${paidAt.getTime()}`,
            stripePaymentId: null,
            status: "COMPLETED",
            completedAt: paidAt,
          },
        });

        // Decrement free credit and increment total tracks
        await prisma.artistProfile.update({
          where: { id: artistProfile.id },
          data: {
            freeReviewCredits: { decrement: 1 },
            totalTracks: { increment: 1 },
          },
        });

        // Assign reviewers
        try {
          await assignReviewersToTrack(track.id);
        } catch (assignError) {
          console.error("Failed to assign reviewers:", assignError);
        }

        // Notify admin
        const sessionEmail = (session?.user as { email?: string } | undefined)?.email || "unknown";
        try {
          await sendAdminNewTrackNotification({
            trackTitle: track.title,
            artistEmail: sessionEmail,
            packageType: "STARTER",
            reviewsRequested: 1,
            isPromo: false,
            promoCode: "FREE_FIRST_REVIEW",
          });
        } catch (notifyError) {
          console.error("Failed to send admin notification:", notifyError);
        }

        // Mark lead as converted
        if (sessionEmail && sessionEmail !== "unknown") {
          await markLeadConverted(sessionEmail.trim().toLowerCase());
        }

        return NextResponse.json({
          success: true,
          trackId: track.id,
          successUrl: `/artist/submit/success?session_id=free_first_review_${track.id}`,
          signIn: false,
        });
      }

      // No free credit - go through paid checkout
      const packageDetails = PACKAGES[data.packageType];
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
        const normalizedEmail = sessionEmail.trim().toLowerCase();
        await markLeadConverted(normalizedEmail);
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

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });

      if (existingUser) {
        if (!existingUser.password) {
          return NextResponse.json(
            { error: "This email is linked to a Google account. Please continue with Google." },
            { status: 400 }
          );
        }

        const isPasswordValid = await bcrypt.compare(data.password, existingUser.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "This email is already registered. That password doesn’t match — try signing in or reset your password." },
            { status: 400 }
          );
        }

        // Get or create artist profile
        let artistProfile = await prisma.artistProfile.findUnique({
          where: { userId: existingUser.id },
        });

        const isNewArtistProfile = !artistProfile;

        if (!artistProfile) {
          const profileName = data.artistName.trim() || existingUser.name || "Artist";
          artistProfile = await prisma.artistProfile.create({
            data: {
              userId: existingUser.id,
              artistName: profileName,
              freeReviewCredits: 1, // New artist profiles get 1 free review
              genres: {
                connect: data.genreIds.map((id) => ({ id })),
              },
            },
          });

          await prisma.user.update({
            where: { id: existingUser.id },
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

        // Check if user has free review credits
        const hasFreeCredit = artistProfile.freeReviewCredits > 0;

        if (hasFreeCredit) {
          // Use free credit - no payment needed
          const paidAt = new Date();
          const track = await prisma.track.create({
            data: {
              artistId: artistProfile.id,
              sourceUrl: data.sourceUrl,
              sourceType,
              title: data.title,
              artworkUrl: data.artworkUrl,
              duration: data.duration,
              feedbackFocus: data.feedbackFocus,
              packageType: "STARTER",
              reviewsRequested: 1,
              status: "QUEUED",
              paidAt,
              promoCode: "FREE_FIRST_REVIEW",
              genres: {
                connect: data.genreIds.map((id) => ({ id })),
              },
            },
          });

          // Create $0 payment record
          await prisma.payment.create({
            data: {
              trackId: track.id,
              amount: 0,
              stripeSessionId: `free_first_review_${track.id}_${paidAt.getTime()}`,
              stripePaymentId: null,
              status: "COMPLETED",
              completedAt: paidAt,
            },
          });

          // Decrement free credit and increment total tracks
          await prisma.artistProfile.update({
            where: { id: artistProfile.id },
            data: {
              freeReviewCredits: { decrement: 1 },
              totalTracks: { increment: 1 },
            },
          });

          // Assign reviewers
          try {
            await assignReviewersToTrack(track.id);
          } catch (assignError) {
            console.error("Failed to assign reviewers:", assignError);
          }

          // Notify admin
          try {
            await sendAdminNewTrackNotification({
              trackTitle: track.title,
              artistEmail: normalizedEmail,
              packageType: "STARTER",
              reviewsRequested: 1,
              isPromo: false,
              promoCode: "FREE_FIRST_REVIEW",
            });
          } catch (notifyError) {
            console.error("Failed to send admin notification:", notifyError);
          }

          await markLeadConverted(normalizedEmail);

          return NextResponse.json({
            success: true,
            trackId: track.id,
            successUrl: `/artist/submit/success?session_id=free_first_review_${track.id}`,
            signIn: true,
          });
        }

        // No free credit - go through paid checkout
        const packageDetails = PACKAGES[data.packageType];

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

        await markLeadConverted(normalizedEmail);

        const checkoutUrl = `/artist/submit/checkout?trackId=${track.id}`;

        return NextResponse.json({
          success: true,
          trackId: track.id,
          checkoutUrl,
          signIn: true,
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

        // 2. Create artist profile with 1 free review credit for new users
        const artistProfile = await tx.artistProfile.create({
          data: {
            userId: user.id,
            artistName: data.artistName,
            freeReviewCredits: 1,
            genres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // 3. Create track - set to QUEUED status directly since we're using free credit
        const paidAt = new Date();
        const track = await tx.track.create({
          data: {
            artistId: artistProfile.id,
            sourceUrl: data.sourceUrl,
            sourceType,
            title: data.title,
            artworkUrl: data.artworkUrl,
            duration: data.duration,
            feedbackFocus: data.feedbackFocus,
            packageType: "STARTER", // Free review uses starter package structure
            reviewsRequested: 1, // Free review = 1 review
            status: "QUEUED", // Skip PENDING_PAYMENT since it's free
            paidAt,
            promoCode: "FREE_FIRST_REVIEW",
            genres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // 4. Create $0 payment record for the free review
        await tx.payment.create({
          data: {
            trackId: track.id,
            amount: 0,
            stripeSessionId: `free_first_review_${track.id}_${paidAt.getTime()}`,
            stripePaymentId: null,
            status: "COMPLETED",
            completedAt: paidAt,
          },
        });

        // 5. Decrement free review credit and increment total tracks
        await tx.artistProfile.update({
          where: { id: artistProfile.id },
          data: {
            freeReviewCredits: { decrement: 1 },
            totalTracks: { increment: 1 },
          },
        });

        // 6. Create email verification token
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

      await markLeadConverted(normalizedEmail);

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

      // Assign reviewers to the track (outside transaction)
      try {
        await assignReviewersToTrack(result.track.id);
      } catch (assignError) {
        console.error("Failed to assign reviewers:", assignError);
        // Don't fail - admin can manually assign if needed
      }

      // Notify admin of new free track submission
      try {
        await sendAdminNewTrackNotification({
          trackTitle: result.track.title,
          artistEmail: normalizedEmail,
          packageType: "STARTER",
          reviewsRequested: 1,
          isPromo: false,
          promoCode: "FREE_FIRST_REVIEW",
        });
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
      }

      // Go directly to success page - no checkout needed
      const successUrl = `/artist/submit/success?session_id=free_first_review_${result.track.id}`;

      return NextResponse.json({
        success: true,
        trackId: result.track.id,
        successUrl, // Direct to success, not checkout
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
