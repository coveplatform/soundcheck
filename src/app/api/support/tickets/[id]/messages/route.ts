import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message } = schema.parse(body);

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, createdAt: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lastMinuteCount = await prisma.supportMessage.count({
      where: {
        ticketId: id,
        authorUserId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (lastMinuteCount >= 5) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment." },
        { status: 429 }
      );
    }

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: "OPEN",
        messages: {
          create: {
            authorType: "USER",
            authorUserId: session.user.id,
            authorEmail: session.user.email,
            body: message,
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Create support message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
