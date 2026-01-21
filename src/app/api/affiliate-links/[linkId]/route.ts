import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateLinkSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

// PATCH - Update affiliate link
export async function PATCH(
  request: Request,
  context: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await context.params;
    const body = await request.json();
    const data = updateLinkSchema.parse(body);

    // Fetch link and verify ownership
    const link = await prisma.trackAffiliateLink.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        createdByUserId: true,
        track: {
          select: {
            trackShareId: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.createdByUserId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this link" },
        { status: 403 }
      );
    }

    // Update the link
    const updated = await prisma.trackAffiliateLink.update({
      where: { id: linkId },
      data,
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

    const fullUrl = link.track.trackShareId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/t/${link.track.trackShareId}?ref=${updated.code}`
      : null;

    return NextResponse.json({
      success: true,
      link: {
        ...updated,
        url: fullUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error updating affiliate link:", error);
    return NextResponse.json(
      { error: "Failed to update affiliate link" },
      { status: 500 }
    );
  }
}

// DELETE - Delete affiliate link
export async function DELETE(
  request: Request,
  context: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await context.params;

    // Fetch link and verify ownership
    const link = await prisma.trackAffiliateLink.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        createdByUserId: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.createdByUserId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this link" },
        { status: 403 }
      );
    }

    // Delete the link
    await prisma.trackAffiliateLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting affiliate link:", error);
    return NextResponse.json(
      { error: "Failed to delete affiliate link" },
      { status: 500 }
    );
  }
}
