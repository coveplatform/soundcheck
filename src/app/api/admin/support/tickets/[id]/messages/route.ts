import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
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

    if (!session?.user?.email || !isAdminEmail(session.user.email) || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { message } = schema.parse(body);

    await prisma.supportTicket.update({
      where: { id },
      data: {
        SupportMessage: {
          create: {
            authorType: "ADMIN",
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

    console.error("Admin create support message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
