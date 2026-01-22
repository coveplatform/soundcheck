import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1).max(60).nullable(),
  artistName: z.string().trim().min(1).max(60).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, artistName } = schema.parse(body);

    // Update user name
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { name: true },
    });

    // Update artist name if provided and user is an artist
    if (artistName !== undefined && session.user.isArtist) {
      await (prisma.artistProfile as any).update({
        where: { userId: session.user.id },
        data: { artistName },
      });
    }

    return NextResponse.json({ success: true, name: updated.name, artistName });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
