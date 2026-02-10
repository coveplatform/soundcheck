import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = (searchParams.get("q") ?? "").trim();

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" } },
                { subject: { contains: q, mode: "insensitive" } },
                { User: { email: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        User: { select: { email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, authorType: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Admin list support tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
