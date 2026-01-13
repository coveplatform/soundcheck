import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendLeadReminderEmail } from "@/lib/email";

// GET: List eligible leads who haven't converted
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find leads who:
    // - Haven't converted (converted = false)
    // - Haven't been reminded yet (reminded = false)
    const eligibleLeads = await prisma.leadCapture.findMany({
      where: {
        converted: false,
        reminded: false,
      },
      select: {
        id: true,
        email: true,
        artistName: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stats
    const [remindedCount, convertedCount] = await Promise.all([
      prisma.leadCapture.count({
        where: { reminded: true, converted: false },
      }),
      prisma.leadCapture.count({
        where: { converted: true },
      }),
    ]);

    return NextResponse.json({
      eligible: eligibleLeads.map((lead) => ({
        id: lead.id,
        email: lead.email,
        artistName: lead.artistName,
        source: lead.source,
        capturedAt: lead.createdAt,
      })),
      stats: {
        eligibleCount: eligibleLeads.length,
        alreadyRemindedCount: remindedCount,
        convertedCount: convertedCount,
      },
    });
  } catch (error) {
    console.error("Get leads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

const postSchema = z.object({
  leadIds: z.array(z.string()).optional(), // If not provided, send to all eligible
});

// POST: Send reminder emails to leads
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadIds } = postSchema.parse(body);

    // Build the query
    const whereClause = {
      converted: false,
      reminded: false,
      ...(leadIds && leadIds.length > 0 ? { id: { in: leadIds } } : {}),
    };

    const leads = await prisma.leadCapture.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        artistName: true,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No eligible leads to email",
      });
    }

    // Send emails and track results
    const results = await Promise.allSettled(
      leads.map(async (lead) => {
        const emailSent = await sendLeadReminderEmail({
          to: lead.email,
          artistName: lead.artistName ?? undefined,
        });

        if (!emailSent) {
          throw new Error(`Email failed for ${lead.email}`);
        }

        // Only mark as reminded if email actually sent
        await prisma.leadCapture.update({
          where: { id: lead.id },
          data: { reminded: true },
        });

        return lead.email;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: leads.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Send lead reminder error:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
