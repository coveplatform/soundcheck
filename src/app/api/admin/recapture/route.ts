import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRecaptureEmail, sendRecaptureEmail } from "@/lib/email/announcements";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

const DEMO_EMAIL_PATTERNS = [
  "@seed.mixreflect.com",
  "@mixreflect.com",
  "@example.com",
  "@soundcheck.com",
];
const DEMO_EMAIL_EXACT = [
  "testlink@gmail.com", "testlink2@gmail.com", "testyjoe@gmail.com",
  "steveking1@gmail.com", "bobthewizard1@gmail.com", "bigdog1@bigdogco.com",
  "bigdogman2@gmail.com", "gogo45@gmail.com", "bogushogus@gmail.com",
  "hot23@gmail.com", "bigbadbozo@gmail.com",
  "daniel.basshead@gmail.com", "alexkimbeats@gmail.com",
  "poopdogwe@google.com", "poopdogger@poop.com",
  "soord@fksss.com", "soord@fk.com", "kris@kris.com", "poop@poop.com",
  "steve2@steve.com", "stevejob@job.com", "cove.platform@proton.me",
  "test@test.com", "tether.platform@proton.me", "jones@jones.com",
  "steveo23@gmail.com", "james.producer.uk@outlook.com", "sean@spdafy.com",
  "qairulothman@gmail.com", "imogengravina@gmail.com",
  "bjorn@bjornengelhardt.com", "a.engelhardt101@gmail.com",
  "simlimsd3@gmail.com", "kris.engelhardt4@gmail.com",
  "millersport98@gmail.com", "illy81095@gmail.com",
  "poop1@poop.com", "testthedog23@pooper.com", "testman1@testman1.com",
  "bigman1@poop.com", "bigdog1@gmail.com", "pash.tzaikos@gmail.com",
  "steve@steve.com",
];

function getLapsedCutoff(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return cutoff;
}

async function getLapsedUsers() {
  const cutoff = getLapsedCutoff();
  return prisma.user.findMany({
    where: {
      email: { not: undefined },
      AND: [
        ...DEMO_EMAIL_PATTERNS.map((pattern) => ({
          email: { not: { contains: pattern } },
        })),
        { email: { notIn: DEMO_EMAIL_EXACT } },
        // lastActiveAt older than 7 days OR never set (signed up but never came back)
        {
          OR: [
            { lastActiveAt: { lt: cutoff } },
            { lastActiveAt: null },
          ],
        },
      ],
    },
    select: { id: true, email: true, name: true, lastActiveAt: true, createdAt: true, ArtistProfile: { select: { id: true } } },
    orderBy: { lastActiveAt: "desc" },
  });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return null;
  }
  return session;
}

// GET: preview HTML or return count of lapsed users
export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "count") {
    const users = await getLapsedUsers();
    return NextResponse.json({ count: users.length, cutoff: getLapsedCutoff().toISOString() });
  }

  if (action === "list") {
    const users = await getLapsedUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        email: u.email,
        name: u.name,
        lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  }

  // Default: return preview HTML
  const { html } = buildRecaptureEmail({ userName: "Alex" });
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// POST: send recapture email to lapsed users (or test)
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { testOnly, testEmail, retryEmails } = body;

    if (testEmail) {
      const success = await sendRecaptureEmail({ to: testEmail, userName: "Alex" });
      return NextResponse.json({ success, sent: 1, total: 1 });
    }

    if (testOnly) {
      const success = await sendRecaptureEmail({
        to: session.user!.email!,
        userName: session.user!.name || undefined,
      });
      return NextResponse.json({ success, sent: 1, total: 1 });
    }

    const PROMO_CREDITS = 5;

    let users: { id: string; email: string | null; name: string | null; ArtistProfile: { id: string } | null }[];
    if (Array.isArray(retryEmails) && retryEmails.length > 0) {
      users = await prisma.user.findMany({
        where: { email: { in: retryEmails } },
        select: { id: true, email: true, name: true, ArtistProfile: { select: { id: true } } },
      });
    } else {
      users = await prisma.user.findMany({
        where: {
          email: { not: undefined },
          AND: [
            ...DEMO_EMAIL_PATTERNS.map((pattern) => ({
              email: { not: { contains: pattern } },
            })),
            { email: { notIn: DEMO_EMAIL_EXACT } },
            {
              OR: [
                { lastActiveAt: { lt: getLapsedCutoff() } },
                { lastActiveAt: null },
              ],
            },
          ],
        },
        select: { id: true, email: true, name: true, ArtistProfile: { select: { id: true } } },
        orderBy: { lastActiveAt: "desc" },
      });
    }

    // Add 5 credits to each user's ArtistProfile up front (fire-and-forget per batch)
    const artistProfileIds = users
      .map((u) => u.ArtistProfile?.id)
      .filter((id): id is string => !!id);

    if (artistProfileIds.length > 0) {
      await prisma.artistProfile.updateMany({
        where: { id: { in: artistProfileIds } },
        data: {
          reviewCredits: { increment: PROMO_CREDITS },
          totalCreditsEarned: { increment: PROMO_CREDITS },
        },
      });
    }

    let sent = 0;
    let failed = 0;
    const failedEmails: string[] = [];

    const BATCH_SIZE = 2;
    const BATCH_DELAY_MS = 1000;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((user) =>
          sendRecaptureEmail({ to: user.email!, userName: user.name || undefined })
        )
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled" && result.value) {
          sent++;
        } else {
          failed++;
          failedEmails.push(batch[j].email || "unknown");
        }
      }
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: users.length, failedEmails });
  } catch (error) {
    console.error("Recapture send error:", error);
    return NextResponse.json(
      { error: "Failed to send", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
