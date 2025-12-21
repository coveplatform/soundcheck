import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { detectSource, PACKAGES, PackageType } from "@/lib/metadata";

const createTrackSchema = z.object({
  sourceUrl: z.string().url("Invalid URL"),
  title: z.string().min(1, "Title is required").max(200),
  artworkUrl: z.string().url().optional().nullable(),
  genreIds: z.array(z.string()).min(1, "Select at least one genre").max(3),
  feedbackFocus: z.string().max(500).optional(),
  packageType: z.enum(["STARTER", "STANDARD", "PRO", "DEEP_DIVE"]),
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

    const body = await request.json();
    const data = createTrackSchema.parse(body);

    // Detect source type from URL
    const sourceType = detectSource(data.sourceUrl);
    if (!sourceType) {
      return NextResponse.json(
        { error: "Invalid track URL. Use SoundCloud, Bandcamp, or YouTube" },
        { status: 400 }
      );
    }

    // Get package details
    const packageDetails = PACKAGES[data.packageType as PackageType];

    // Create track
    const track = await prisma.track.create({
      data: {
        artistId: artistProfile.id,
        sourceUrl: data.sourceUrl,
        sourceType,
        title: data.title,
        artworkUrl: data.artworkUrl,
        feedbackFocus: data.feedbackFocus,
        packageType: data.packageType,
        reviewsRequested: packageDetails.reviews,
        genres: {
          connect: data.genreIds.map((id) => ({ id })),
        },
      },
      include: {
        genres: true,
      },
    });

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
