import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Music, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListenTile } from "./listen-tile";

export const dynamic = "force-dynamic";

interface ClaimedReview {
  id: string;
  Track: {
    id: string;
    title: string;
    artworkUrl: string | null;
    ArtistProfile: { artistName: string };
  };
}

export default async function ListenPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const notice = resolvedParams.notice;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      reviewCredits: true,
      subscriptionStatus: true,
    },
  });

  if (!artistProfile) redirect("/onboarding");

  const BYPASS_LIMIT_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
  const bypassLimit = BYPASS_LIMIT_EMAILS.includes((session.user.email ?? "").toLowerCase());

  const MAX_REVIEWS_PER_DAY = 5;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [reviewsTodayCount, claimedReviews, pastReviewTrackIds] = await Promise.all([
    prisma.review.count({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: "COMPLETED",
        updatedAt: { gte: startOfToday },
      },
    }),
    prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        Track: { status: { not: "COMPLETED" } },
      },
      select: {
        id: true,
        Track: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            ArtistProfile: { select: { artistName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }) as Promise<ClaimedReview[]>,
    prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["COMPLETED", "SKIPPED", "EXPIRED"] },
      },
      select: { trackId: true },
    }),
  ]);

  const reviewsRemaining = bypassLimit ? null : Math.max(0, MAX_REVIEWS_PER_DAY - reviewsTodayCount);
  const excludeTrackIds = [
    ...claimedReviews.map((r) => r.Track.id),
    ...pastReviewTrackIds.map((r) => r.trackId),
  ];

  const availableTracksRaw = await prisma.track.findMany({
    where: {
      packageType: "PEER",
      status: { in: ["QUEUED", "IN_PROGRESS"] },
      artistId: { not: artistProfile.id },
      id: { notIn: excludeTrackIds },
    },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      reviewsRequested: true,
      createdAt: true,
      ArtistProfile: {
        select: {
          artistName: true,
          subscriptionStatus: true,
          User: { select: { email: true } },
        },
      },
      _count: {
        select: {
          Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } },
        },
      },
    },
  });

  const available = availableTracksRaw
    .filter((t) => t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      const aIsPro = a.ArtistProfile?.subscriptionStatus === "active";
      const bIsPro = b.ArtistProfile?.subscriptionStatus === "active";
      if (aIsPro !== bIsPro) return aIsPro ? -1 : 1;
      const aIsSeed = a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed = b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0;
    });

  const credits = artistProfile.reviewCredits ?? 0;
  const limitReached = !bypassLimit && reviewsRemaining === 0;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Listen.
              </h1>
              <p className="text-sm text-black/40 font-medium mt-2">
                Pick whatever catches your eye. Leave honest feedback. Earn +1 credit.
              </p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">
                {credits}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                {credits === 1 ? "credit" : "credits"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── NOTICES ────────────────────────────────────────────── */}
      {notice === "skipped" && (
        <div className="bg-lime-400 border-b-2 border-black/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-black">Track skipped.</p>
            <Link href="/review" className="text-[11px] font-black text-black border-2 border-black px-3 py-1 rounded-full hover:bg-black hover:text-lime-400 transition-colors">
              Dismiss
            </Link>
          </div>
        </div>
      )}
      {(notice === "expired" || notice === "unplayable") && (
        <div className="bg-red-500 border-b-2 border-red-600">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">
              {notice === "expired" ? "Review expired." : "Audio issue reported — removed from your queue."}
            </p>
            <Link href="/review" className="text-[11px] font-black text-white border-2 border-white px-3 py-1 rounded-full hover:bg-white hover:text-red-500 transition-colors">
              Dismiss
            </Link>
          </div>
        </div>
      )}

      {/* ── IN PROGRESS ────────────────────────────────────────── */}
      {claimedReviews.length > 0 && (
        <div className="bg-neutral-900 border-b-2 border-black">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex-shrink-0">
              In progress
            </p>
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {claimedReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/review/${review.id}/v2`}
                  className="flex items-center gap-2 flex-shrink-0 bg-white/8 hover:bg-white/14 border border-white/10 rounded-xl px-3 py-2 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 relative">
                    {review.Track.artworkUrl ? (
                      <Image src={review.Track.artworkUrl} alt={review.Track.title} fill className="object-cover" sizes="28px" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                        <Music className="h-3 w-3 text-white/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-black text-white truncate max-w-[120px]">{review.Track.title}</p>
                  <ArrowRight className="h-3 w-3 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ARTWORK GRID ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {limitReached && (
          <div className="mb-6 rounded-2xl bg-amber-50 border-2 border-amber-300 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-black">Daily limit reached</p>
              <p className="text-xs text-black/50 mt-0.5">You can review up to {MAX_REVIEWS_PER_DAY} tracks per day. Come back tomorrow.</p>
            </div>
            <Link href="/pro">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-9 px-4 text-xs rounded-xl whitespace-nowrap">
                Go Pro
              </Button>
            </Link>
          </div>
        )}

        {available.length === 0 && !limitReached ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-5">
              <Music className="h-7 w-7 text-white/40" />
            </div>
            <p className="text-xl font-black text-black">Nothing here right now</p>
            <p className="text-sm text-black/40 mt-2 font-medium">
              The queue refreshes as artists submit tracks — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {available.map((track) => (
              <ListenTile
                key={track.id}
                trackId={track.id}
                title={track.title}
                artistName={track.ArtistProfile.artistName}
                artworkUrl={track.artworkUrl}
                reviewsRemaining={reviewsRemaining}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
