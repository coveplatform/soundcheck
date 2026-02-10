import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProfileSchema = z.object({
  artistName: z.string().min(1, "Artist name is required").max(100),
  genreIds: z.array(z.string()).max(5).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Your session is out of date. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { artistName, genreIds } = createProfileSchema.parse(body);

    // Check if profile already exists
    const existingProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      // Update existing profile
      const profile = await prisma.artistProfile.update({
        where: { userId: session.user.id },
        data: {
          artistName,
          ...(genreIds !== undefined
            ? {
                genres: {
                  set: genreIds.map((id) => ({ id })),
                },
              }
            : {}),
        },
        include: { Genre: true },
      });

      return NextResponse.json(profile);
    }

    // Create new profile
    // Note: hasSeenWelcome will use database default (false) if the column exists
    const profile = await prisma.artistProfile.create({
      data: {
        userId: session.user.id,
        artistName,
        reviewCredits: 2,
        ...(genreIds && genreIds.length > 0
          ? {
              genres: {
                connect: genreIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: { Genre: true },
    });

    // Update user to mark as artist
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isArtist: true },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating artist profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        genres: true,
        tracks: {
          select: { id: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Add track count and subscription status to response
    const response = {
      ...profile,
      totalTracks: profile.tracks.length,
      subscriptionStatus: profile.subscriptionStatus,
      reviewCredits: profile.reviewCredits,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching artist profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
