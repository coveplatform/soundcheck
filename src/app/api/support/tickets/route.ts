import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createTicketSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recentTicketCount = await prisma.supportTicket.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (recentTicketCount >= 3) {
      return NextResponse.json(
        { error: "Too many tickets created. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: data.subject,
        SupportMessage: {
          create: {
            authorType: "USER",
            authorUserId: session.user.id,
            authorEmail: session.user.email,
            body: data.message,
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Create support ticket error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId: session.user.id,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        SupportMessage: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, authorType: true },
        },
        _count: { select: { SupportMessage: true } },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("List support tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
