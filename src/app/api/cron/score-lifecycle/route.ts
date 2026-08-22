import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReportReminderEmail, sendSecondTrackEmail } from "@/lib/email/score";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

const SEED_SUFFIX = "@seed.mixreflect.com";

// A "real, claimed" recipient: claimed, has an @, and is not a seed account.
function isRealClaimed(report: { email: string; claimedAt: Date | null }): boolean {
  if (!report.claimedAt) return false;
  if (!report.email.includes("@")) return false;
  if (report.email.endsWith(SEED_SUFFIX)) return false;
  return true;
}

// Two behavioral lifecycle emails for the score-report product:
//   A — scored but never unlocked: report has an AI score, user never paid.
//   B — unlocked once, never came back: user paid once, never submitted another.
async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const days14Ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let sentA = 0;
  let sentB = 0;
  let skipped = 0;

  // ── Segment A: scored but never unlocked ──────────────────────────
  // 14-day floor avoids blasting the entire historical backlog on first run.
  const segmentA = await prisma.trackScoreReport.findMany({
    where: {
      score: { not: null },
      paidAt: null,
      reminderEmailedAt: null,
      claimedAt: { not: null },
      email: { contains: "@", not: { endsWith: SEED_SUFFIX } },
      completedAt: { gte: days14Ago, lte: dayAgo },
    },
    select: { id: true, email: true, claimedAt: true, trackTitle: true, slug: true },
  });

  for (const report of segmentA) {
    if (!isRealClaimed(report)) { skipped++; continue; }
    try {
      await sendReportReminderEmail({
        to: report.email,
        trackTitle: report.trackTitle,
        slug: report.slug,
      });
      await prisma.trackScoreReport.update({
        where: { id: report.id },
        data: { reminderEmailedAt: new Date() },
      });
      sentA++;
    } catch (err) {
      console.error(`[score-lifecycle] segment A send failed for ${report.email}:`, err);
      skipped++;
    }
  }

  // ── Segment B: unlocked once, never came back ─────────────────────
  // 30-day window from payment; only fire if they never submitted another track.
  const segmentB = await prisma.trackScoreReport.findMany({
    where: {
      paidAt: { not: null, gte: days30Ago, lte: dayAgo },
      secondTrackEmailedAt: null,
      claimedAt: { not: null },
      email: { contains: "@", not: { endsWith: SEED_SUFFIX } },
    },
    select: {
      id: true,
      email: true,
      claimedAt: true,
      trackTitle: true,
      createdAt: true,
      ArtistProfile: { select: { artistName: true } },
    },
    // Most recent paid report first, so if an email has several eligible we act
    // on the newest and skip-stamp the older ones below.
    orderBy: { paidAt: "desc" },
  });

  // Only one send per email even if multiple paid reports are eligible.
  const handledEmails = new Set<string>();

  for (const report of segmentB) {
    if (!isRealClaimed(report)) { skipped++; continue; }

    if (handledEmails.has(report.email)) {
      // Older eligible report for an email we already acted on — stamp so it's
      // not re-evaluated forever, but don't send a second time.
      try {
        await prisma.trackScoreReport.update({
          where: { id: report.id },
          data: { secondTrackEmailedAt: new Date() },
        });
      } catch (err) {
        console.error(`[score-lifecycle] segment B stamp failed for ${report.id}:`, err);
      }
      skipped++;
      continue;
    }

    // Did they ever submit another track after this one?
    const newer = await prisma.trackScoreReport.findFirst({
      where: {
        email: report.email,
        createdAt: { gt: report.createdAt },
      },
      select: { id: true },
    });

    if (newer) {
      // They came back — no nudge needed. Stamp so we don't re-check forever.
      handledEmails.add(report.email);
      try {
        await prisma.trackScoreReport.update({
          where: { id: report.id },
          data: { secondTrackEmailedAt: new Date() },
        });
      } catch (err) {
        console.error(`[score-lifecycle] segment B stamp failed for ${report.id}:`, err);
      }
      skipped++;
      continue;
    }

    handledEmails.add(report.email);
    try {
      await sendSecondTrackEmail({
        to: report.email,
        name: report.ArtistProfile?.artistName ?? null,
        trackTitle: report.trackTitle,
      });
      await prisma.trackScoreReport.update({
        where: { id: report.id },
        data: { secondTrackEmailedAt: new Date() },
      });
      sentB++;
    } catch (err) {
      console.error(`[score-lifecycle] segment B send failed for ${report.email}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ success: true, sent: { a: sentA, b: sentB }, skipped });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
