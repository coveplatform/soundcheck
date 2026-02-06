import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { detectSource, PACKAGES, PackageType } from "@/lib/metadata";

const createTrackSchema = z.object({
  sourceUrl: z.string().min(1, "Track source is required"),
  sourceType: z.enum(["SOUNDCLOUD", "BANDCAMP", "YOUTUBE", "UPLOAD"]).optional(),
  title: z.string().min(1, "Title is required").max(200),
  artworkUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().max(60 * 60).optional(),
  bpm: z.number().int().min(1).max(999).optional(),
  genreIds: z.array(z.string()).min(1, "Select at least one genre").max(3),
  feedbackFocus: z.string().max(1000).optional(),
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE", "PEER"]).optional(),
  reviewsRequested: z.number().int().min(1).max(10).optional(),
  allowPurchase: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  hasStems: z.boolean().optional(),
  abletonProjectUrl: z.string().optional(),
  abletonProjectData: z.any().optional(),
  abletonRenderStatus: z.enum(["PENDING", "RENDERING", "COMPLETED", "FAILED"]).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to submit a track" },
        { status: 403 }
      );
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

    const body = await request.json();
    const data = createTrackSchema.parse(body);

    console.log("Track creation - sourceUrl:", data.sourceUrl);
    console.log("Track creation - sourceType:", data.sourceType);
    console.log("Track creation - abletonProjectUrl:", data.abletonProjectUrl);

    let sourceType = data.sourceType ?? detectSource(data.sourceUrl);

    if (data.sourceType === "UPLOAD") {
      const isLocalUpload =
        data.sourceUrl.startsWith("/uploads/") ||
        (data.sourceUrl.startsWith("/ableton-projects/") && data.sourceUrl.toLowerCase().endsWith(".zip"));
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

    const shouldRequestReviews = !!data.packageType;

    const packageType: PackageType = (data.packageType ?? "PEER") as PackageType;
    const isPeerPackage = packageType === "PEER";

    // For PEER packages, reviewsRequested comes from credits spent
    const reviewsRequested = isPeerPackage
      ? (data.reviewsRequested ?? 0)
      : PACKAGES[packageType].reviews;

    const createData = {
      artistId: artistProfile.id,
      sourceUrl: data.sourceUrl,
      sourceType,
      title: data.title,
      artworkUrl: data.artworkUrl,
      duration: data.duration,
      bpm: data.bpm,
      feedbackFocus: data.feedbackFocus,
      isPublic: data.isPublic ?? false,
      hasStems: data.hasStems ?? false,
      packageType,
      reviewsRequested: shouldRequestReviews ? reviewsRequested : 0,
      creditsSpent: isPeerPackage && shouldRequestReviews ? reviewsRequested : 0,
      status: shouldRequestReviews ? undefined : ("UPLOADED" as any),
      // Only allow purchases for uploaded tracks AND Pro subscribers
      allowPurchase: sourceType === "UPLOAD" && isSubscribed ? (data.allowPurchase ?? false) : false,
      // Ableton project data
      abletonProjectUrl: data.abletonProjectUrl,
      abletonProjectData: data.abletonProjectData,
      // Auto-trigger render if Ableton project is uploaded
      abletonRenderStatus: data.abletonProjectUrl ? "PENDING" : data.abletonRenderStatus,
      genres: {
        connect: data.genreIds.map((id) => ({ id })),
      },
    } as any;

    let track;
    try {
      track = await prisma.track.create({
        data: createData,
        include: {
          genres: true,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("Unknown argument `isPublic`")) {
        const { isPublic: _ignored, ...fallbackData } = createData as Record<string, unknown>;
        track = await prisma.track.create({
          data: fallbackData as any,
          include: {
            genres: true,
          },
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
        genres: true,
        _count: {
          select: { reviews: true },
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
