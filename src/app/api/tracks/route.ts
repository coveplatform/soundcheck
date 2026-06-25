import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrackStatus } from "@prisma/client";
import { z } from "zod";
import { detectSource, resolveShortUrl, PackageType } from "@/lib/metadata";
import { hasAvailableSlot, hasAvailableUpload } from "@/lib/slots";

const trackSourceSchema = z.object({
  sourceUrl: z.string().min(1, "Track source is required"),
  sourceType: z.enum(["SOUNDCLOUD", "BANDCAMP", "YOUTUBE", "UPLOAD"]).optional(),
  title: z.string().min(1, "Title is required").max(200),
  artworkUrl: z.string().url().optional().nullable(),
});

const createTrackSchema = z.object({
  sourceUrl: z.string().min(1, "Track source is required"),
  sourceType: z.enum(["SOUNDCLOUD", "BANDCAMP", "YOUTUBE", "UPLOAD"]).optional(),
  title: z.string().min(1, "Title is required").max(200),
  artworkUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().max(60 * 60).optional(),
  bpm: z.number().int().min(1).max(999).optional(),
  genreIds: z.array(z.string()).max(3).optional().default([]),
  feedbackFocus: z.string().max(1000).optional(),
  feedbackAreas: z.array(
    z.enum(["OVERALL_VIBE", "MIXING", "ARRANGEMENT", "SONGWRITING", "SOUND_DESIGN", "RELEASE_READINESS"])
  ).min(1).max(3).optional(),
  packageType: z.enum(["PEER"]).optional(),
  reviewsRequested: z.number().int().min(1).max(50).optional(),
  allowPurchase: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  // Optional secondary track for A/B test pairs
  abTestSecondary: trackSourceSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: "Please complete your artist profile first" },
        { status: 400 }
      );
    }

    const isSubscribed = artistProfile.subscriptionStatus === "active";

    // Upload cap: free users limited to 1 track in library
    const uploadCheck = await hasAvailableUpload(artistProfile.id, isSubscribed);
    if (!uploadCheck.available) {
      return NextResponse.json(
        {
          error: "You've used your 1 free track upload. Go Pro to upload unlimited tracks.",
          uploadCount: uploadCheck.uploadCount,
          maxUploads: uploadCheck.maxUploads,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Slot enforcement: check if user has an available queue slot
    const slotCheck = await hasAvailableSlot(artistProfile.id, isSubscribed);
    if (!slotCheck.available) {
      return NextResponse.json(
        {
          error: "All your review slots are in use. Wait for current reviews to complete, or upgrade to Pro for more slots.",
          activeCount: slotCheck.activeCount,
          maxSlots: slotCheck.maxSlots,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const data = createTrackSchema.parse(body);

    // Resolve short SoundCloud links (on.soundcloud.com) to their full URL
    data.sourceUrl = await resolveShortUrl(data.sourceUrl);

    console.log("Track creation - sourceUrl:", data.sourceUrl);
    console.log("Track creation - sourceType:", data.sourceType);

    let sourceType = data.sourceType ?? detectSource(data.sourceUrl);

    if (data.sourceType === "UPLOAD") {
      const isLocalUpload =
        data.sourceUrl.startsWith("/uploads/") ||
        false;
      let isRemoteUpload = false;

      if (!isLocalUpload) {
        try {
          const parsed = new URL(data.sourceUrl);
          isRemoteUpload = parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
          isRemoteUpload = false;
        }
      }

      console.log("Upload validation - isLocalUpload:", isLocalUpload, "isRemoteUpload:", isRemoteUpload);

      if (!isLocalUpload && !isRemoteUpload) {
        return NextResponse.json({ error: "Invalid upload URL" }, { status: 400 });
      }

      sourceType = "UPLOAD";
    }

    if (!sourceType) {
      return NextResponse.json(
        { error: "Invalid track URL. Use SoundCloud, Bandcamp, or YouTube" },
        { status: 400 }
      );
    }

    // Track creation always starts with 0 reviews requested.
    // The /request-reviews endpoint handles credit validation and sets the real count.
    const packageType: PackageType = "PEER";

    const createData = {
      artistId: artistProfile.id,
      sourceUrl: data.sourceUrl,
      sourceType,
      title: data.title,
      artworkUrl: data.artworkUrl,
      duration: data.duration,
      bpm: data.bpm,
      feedbackFocus: data.feedbackFocus,
      feedbackAreas: data.feedbackAreas ?? [],
      isPublic: data.isPublic ?? false,
      packageType,
      reviewsRequested: 0,
      creditsSpent: 0,
      status: TrackStatus.UPLOADED,
      // Only allow purchases for uploaded tracks AND Pro subscribers
      allowPurchase: sourceType === "UPLOAD" && isSubscribed ? (data.allowPurchase ?? false) : false,
      ...(data.genreIds.length > 0 && {
        Genre: {
          connect: data.genreIds.map((id) => ({ id })),
        },
      }),
    };

    // If A/B test: validate and resolve the secondary track URL too
    let secondarySourceType: string | null = null;
    if (data.abTestSecondary) {
      const sec = data.abTestSecondary;
      let resolvedSecUrl = await resolveShortUrl(sec.sourceUrl);
      sec.sourceUrl = resolvedSecUrl;

      if (sec.sourceType === "UPLOAD") {
        try {
          const parsed = new URL(resolvedSecUrl);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            return NextResponse.json({ error: "Invalid upload URL for Track B" }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid upload URL for Track B" }, { status: 400 });
        }
        secondarySourceType = "UPLOAD";
      } else {
        secondarySourceType = sec.sourceType ?? detectSource(resolvedSecUrl);
        if (!secondarySourceType) {
          return NextResponse.json({ error: "Invalid Track B URL. Use SoundCloud, Bandcamp, or YouTube" }, { status: 400 });
        }
      }
    }

    let track;
    try {
      if (data.abTestSecondary && secondarySourceType) {
        // Create both tracks atomically — Track A first, then Track B linked to it
        const sec = data.abTestSecondary;
        const result = await prisma.$transaction(async (tx) => {
          const trackA = await tx.track.create({
            data: { ...createData, isAbTest: true },
            include: { Genre: true },
          });
          const trackB = await tx.track.create({
            data: {
              artistId: artistProfile.id,
              sourceUrl: sec.sourceUrl,
              sourceType: secondarySourceType as any,
              title: sec.title,
              artworkUrl: sec.artworkUrl,
              feedbackFocus: createData.feedbackFocus,
              feedbackAreas: createData.feedbackAreas,
              isPublic: false,
              packageType,
              reviewsRequested: 0,
              creditsSpent: 0,
              status: TrackStatus.UPLOADED,
              allowPurchase: false,
              isAbTest: true,
              abTestPrimaryTrackId: trackA.id,
              ...(data.genreIds.length > 0 && {
                Genre: { connect: data.genreIds.map((id) => ({ id })) },
              }),
            },
            include: { Genre: true },
          });
          return { trackA, trackB };
        });
        return NextResponse.json(result, { status: 201 });
      }

      track = await prisma.track.create({
        data: createData,
        include: { Genre: true },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("Unknown argument `isPublic`")) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isPublic: _ignored, ...fallbackData } = createData;
        track = await prisma.track.create({
          data: fallbackData as any,
          include: { Genre: true },
        });
      } else {
        throw e;
      }
    }

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating track:", error);
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!artistProfile) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const tracks = await prisma.track.findMany({
      where: {
        artistId: artistProfile.id,
        ...(status && { status: status as never }),
      },
      include: {
        Genre: true,
        _count: {
          select: { Review: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
