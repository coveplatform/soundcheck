import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAnnouncementEmail, sendAnnouncementEmail } from "@/lib/email";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

// Patterns for seed/demo/test/internal accounts — same as admin/users page
const DEMO_EMAIL_PATTERNS = [
  "@seed.mixreflect.com",
  "@mixreflect.com",
  "@example.com",
  "@soundcheck.com",
];
const DEMO_EMAIL_EXACT = [
  "testlink@gmail.com",
  "testlink2@gmail.com",
  "testyjoe@gmail.com",
];

// GET: preview the announcement email
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "count") {
    // Return count of real users who would receive the email
    const users = await prisma.user.findMany({
      where: {
        email: { not: undefined },
        AND: [
          ...DEMO_EMAIL_PATTERNS.map((pattern) => ({
            email: { not: { contains: pattern } },
          })),
          { email: { notIn: DEMO_EMAIL_EXACT } },
        ],
      },
      select: { id: true },
    });
    return NextResponse.json({ count: users.length });
  }

  // Default: return preview HTML
  const { html } = buildAnnouncementEmail({ userName: "Test User" });
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// POST: send announcement to all real users (or just to admin for testing)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { testOnly } = body; // if true, only send to the admin's own email

    if (testOnly) {
      const success = await sendAnnouncementEmail({
        to: session.user.email,
        userName: session.user.name || undefined,
      });
      return NextResponse.json({ success, sent: 1, total: 1 });
    }

    // Fetch all real users
    const users = await prisma.user.findMany({
      where: {
        email: { not: undefined },
        AND: [
          ...DEMO_EMAIL_PATTERNS.map((pattern) => ({
            email: { not: { contains: pattern } },
          })),
          { email: { notIn: DEMO_EMAIL_EXACT } },
        ],
      },
      select: { email: true, name: true },
    });

    let sent = 0;
    let failed = 0;

    // Send in batches of 5 with small delays to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((user) =>
          sendAnnouncementEmail({
            to: user.email!,
            userName: user.name || undefined,
          })
        )
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          sent++;
        } else {
          failed++;
        }
      }
      // Small delay between batches
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: users.length });
  } catch (error) {
    console.error("Announcement send error:", error);
    return NextResponse.json(
      { error: "Failed to send", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
