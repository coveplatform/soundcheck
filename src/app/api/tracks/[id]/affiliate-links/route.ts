import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { nanoid } from "nanoid";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createLinkSchema = z.object({
  name: z.string().min(1).max(100), // Campaign name like "Twitter January"
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Code can only contain lowercase letters, numbers, hyphens, and underscores")
    .optional(), // Optional custom code, otherwise auto-generated
});

const updateLinkSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

// POST - Create new affiliate link
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await context.params;
    const body = await request.json();
    const data = createLinkSchema.parse(body);

    // Fetch track and verify ownership + sharing enabled
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        trackShareId: true,
        sharingEnabled: true,
        artist: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to manage this track" },
        { status: 403 }
      );
    }

    if (!track.sharingEnabled || !track.trackShareId) {
      return NextResponse.json(
        { error: "Sharing must be enabled before creating affiliate links" },
        { status: 400 }
      );
    }

    // Generate code if not provided
    let code = data.code;
    if (!code) {
      code = `${nanoid(8).toLowerCase()}`; // e.g., "x3k2hd8q"
    }

    // Check if code already exists
    const existing = await prisma.trackAffiliateLink.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This code is already in use. Please choose a different one." },
        { status: 400 }
      );
    }

    // Create affiliate link
    const affiliateLink = await prisma.trackAffiliateLink.create({
      data: {
        trackId: track.id,
        code,
        name: data.name,
        createdByUserId: session.user.id,
      },
      select: {
        id: true,
        code: true,
        name: true,
        clickCount: true,
        playCount: true,
        purchaseCount: true,
        totalRevenue: true,
        isActive: true,
        createdAt: true,
      },
    });

    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${track.trackShareId}?ref=${code}`;

    return NextResponse.json({
      success: true,
      link: affiliateLink,
      url: fullUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error creating affiliate link:", error);
    return NextResponse.json(
      { error: "Failed to create affiliate link" },
      { status: 500 }
    );
  }
}

// GET - List all affiliate links for a track
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await context.params;

    // Fetch track and verify ownership
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        trackShareId: true,
        artist: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.artist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this track" },
        { status: 403 }
      );
    }

    // Fetch all affiliate links for this track
    const links = await prisma.trackAffiliateLink.findMany({
      where: {
        trackId: track.id,
        createdByUserId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        clickCount: true,
        playCount: true,
        purchaseCount: true,
        totalRevenue: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Add full URL to each link
    const linksWithUrls = links.map((link) => ({
      ...link,
      url: track.trackShareId
        ? `${process.env.NEXT_PUBLIC_APP_URL}/t/${track.trackShareId}?ref=${link.code}`
        : null,
    }));

    return NextResponse.json({
      links: linksWithUrls,
    });
  } catch (error) {
    console.error("Error fetching affiliate links:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate links" },
      { status: 500 }
    );
  }
}
