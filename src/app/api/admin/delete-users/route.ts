import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emails } = await request.json() as { emails: string[] };
    if (!emails?.length) return NextResponse.json({ error: "No emails provided" }, { status: 400 });

    const results: { email: string; status: string }[] = [];

    for (const email of emails) {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, ArtistProfile: { select: { id: true } } },
        });

        if (!user) { results.push({ email, status: "not_found" }); continue; }

        // Delete child records in order to avoid FK constraint errors
        if (user.ArtistProfile) {
          const apId = user.ArtistProfile.id;

          // Reviews the artist received
          await prisma.review.deleteMany({ where: { Track: { artistId: apId } } });
          // Reviews the artist wrote
          await prisma.review.deleteMany({ where: { peerReviewerArtistId: apId } });
          // Tracks
          await prisma.track.deleteMany({ where: { artistId: apId } });
          // ArtistProfile genre links
          await (prisma as any).genreArtistReviewGenre?.deleteMany?.({ where: { artistProfileId: apId } });
        }

        // Auth/session records
        await prisma.account.deleteMany({ where: { userId: user.id } });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
        await prisma.chartVote.deleteMany({ where: { userId: user.id } });

        // Now delete the user (cascades ArtistProfile, ReviewerProfile, etc.)
        await prisma.user.delete({ where: { id: user.id } });

        results.push({ email, status: "deleted" });
      } catch (err) {
        results.push({ email, status: `error: ${err instanceof Error ? err.message : "unknown"}` });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: "Failed", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
