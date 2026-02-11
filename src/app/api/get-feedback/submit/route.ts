import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendAdminNewTrackNotification } from "@/lib/email";
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
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE", "PEER"]),

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
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE", "PEER"]),
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
        await prisma.leadCapture.updateMany({
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
        // Create profile with genres from the track
        // Use provided artistName, fall back to user name, then "Artist"
        const profileName = data.artistName?.trim() || session.user.name || "Artist";
        artistProfile = await prisma.artistProfile.create({
          data: {
            userId: session.user.id,
            artistName: profileName,
            reviewCredits: 2,
            Genre_ArtistGenres: {
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

      const artistProfileId = artistProfile?.id;
      if (!artistProfileId) {
        return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
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

      // Handle PEER vs paid packages
      const packageDetails = PACKAGES[data.packageType];
      const isPeerPackage = data.packageType === "PEER";

      // For PEER packages, we need credits
      if (isPeerPackage) {
        // Default to 1 credit if not specified
        const creditsToSpend = 1;
        const currentCredits = artistProfile.reviewCredits ?? 0;

        if (currentCredits < creditsToSpend) {
          return NextResponse.json(
            { error: `Not enough credits. You have ${currentCredits}, need ${creditsToSpend}.` },
            { status: 400 }
          );
        }

        // Create track and deduct credits in a transaction
        const track = await prisma.$transaction(async (tx) => {
          // Deduct credits from artist
          await tx.artistProfile.update({
            where: { id: artistProfileId },
            data: {
              reviewCredits: { decrement: creditsToSpend },
              totalCreditsSpent: { increment: creditsToSpend },
            },
          });

          // Create track with QUEUED status (no payment needed)
          return tx.track.create({
            data: {
              artistId: artistProfileId,
              sourceUrl: data.sourceUrl,
              sourceType,
              title: data.title,
              artworkUrl: data.artworkUrl,
              duration: data.duration,
              feedbackFocus: data.feedbackFocus,
              packageType: data.packageType,
              reviewsRequested: creditsToSpend,
              creditsSpent: creditsToSpend,
              status: "QUEUED", // Skip payment
              paidAt: new Date(), // Mark as "paid" via credits
              Genre: {
                connect: data.genreIds.map((id) => ({ id })),
              },
            },
          });
        });

        // Mark lead as converted
        const sessionEmail = (session?.user as { email?: string } | undefined)?.email;
        if (sessionEmail) {
          const normalizedEmail = sessionEmail.trim().toLowerCase();
          await markLeadConverted(normalizedEmail);
        }

        return NextResponse.json({
          success: true,
          trackId: track.id,
          checkoutUrl: null, // No checkout needed for PEER
          signIn: false,
        });
      }

      // Paid package flow
      const track = await prisma.track.create({
        data: {
          artistId: artistProfileId,
          sourceUrl: data.sourceUrl,
          sourceType,
          title: data.title,
          artworkUrl: data.artworkUrl,
          duration: data.duration,
          feedbackFocus: data.feedbackFocus,
          packageType: data.packageType,
          reviewsRequested: packageDetails.Review,
          Genre: {
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
              reviewCredits: 2,
              Genre_ArtistGenres: {
                connect: data.genreIds.map((id) => ({ id })),
              },
            },
          });

          await prisma.user.update({
            where: { id: existingUser.id },
            data: { isArtist: true },
          });
        }

        const artistProfileId = artistProfile?.id;
        if (!artistProfileId) {
          return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
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

        // Go through paid checkout
        const packageDetails = PACKAGES[data.packageType];

        const track = await prisma.track.create({
          data: {
            artistId: artistProfileId,
            sourceUrl: data.sourceUrl,
            sourceType,
            title: data.title,
            artworkUrl: data.artworkUrl,
            duration: data.duration,
            feedbackFocus: data.feedbackFocus,
            packageType: data.packageType,
            reviewsRequested: packageDetails.Review,
            Genre: {
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

        // 2. Create artist profile
        const artistProfile = await tx.artistProfile.create({
          data: {
            userId: user.id,
            artistName: data.artistName,
            reviewCredits: 2,
            Genre_ArtistGenres: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        // 3. Create track in PENDING_PAYMENT status
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
            reviewsRequested: packageDetails.Review,
            Genre: {
              connect: data.genreIds.map((id) => ({ id })),
            },
          },
        });

        return { user, artistProfile, track };
      });

      await markLeadConverted(normalizedEmail);

      // Go to checkout
      const checkoutUrl = `/artist/submit/checkout?trackId=${result.track.id}`;

      return NextResponse.json({
        success: true,
        trackId: result.track.id,
        checkoutUrl,
        signIn: true,
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
