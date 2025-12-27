import { NextResponse } from "next/server";

import { expireAndReassignExpiredQueueEntries } from "@/lib/queue";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;

  const auth = request.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;

  return false;
}

async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireAndReassignExpiredQueueEntries();

    return NextResponse.json({
      success: true,
      expiredCount: result.expiredCount,
      affectedTrackCount: result.affectedTrackCount,
    });
  } catch (error) {
    console.error("Cron expire-queue error:", error);
    return NextResponse.json(
      { error: "Failed to expire queue" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
