import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

const schema = z.object({
  isRestricted: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRestricted } = schema.parse(body);

    const reviewer = await prisma.reviewerProfile.update({
      where: { id },
      data: { isRestricted },
      select: { id: true, isRestricted: true },
    });

    if (isRestricted) {
      await prisma.reviewQueue.deleteMany({
        where: { reviewerId: reviewer.id },
      });

      await prisma.review.updateMany({
        where: {
          reviewerId: reviewer.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        data: { status: "EXPIRED" },
      });
    }

    return NextResponse.json({ success: true, reviewer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Admin restrict reviewer error:", error);
    return NextResponse.json(
      { error: "Failed to update reviewer" },
      { status: 500 }
    );
  }
}
