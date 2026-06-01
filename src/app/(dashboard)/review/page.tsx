import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_DAILY_REVIEW_LIMIT } from "@/lib/pricing";
import { Music, ArrowRight, Crown, Zap } from "lucide-react";
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

  const BYPASS_LIMIT_EMAILS = ["synthqueen@mixreflect.com", "davo2@mixreflect.com"];
  const isPro = artistProfile.subscriptionStatus === "active";
  const bypassLimit = isPro || BYPASS_LIMIT_EMAILS.includes((session.user.email ?? "").toLowerCase());

  const MAX_REVIEWS_PER_DAY = FREE_DAILY_REVIEW_LIMIT;
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
      // Secondary AB tracks are claimed automatically — never shown directly to reviewers
      abTestPrimaryTrackId: null,
    },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      reviewsRequested: true,
      createdAt: true,
      paidAt: true,
      isAbTest: true,
      other_Track: { select: { artworkUrl: true } },
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
      const aTime = a.paidAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.paidAt?.getTime() ?? b.createdAt.getTime();
      return aTime - bTime;
    });

  const credits = artistProfile.reviewCredits ?? 0;
  const limitReached = !bypassLimit && reviewsRemaining === 0;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-[#0f0f18]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/25 mb-3">Review & Earn</p>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-none tracking-tight">
              Listen.
            </h1>
            <p className="text-[15px] text-white/40 font-medium mt-3 max-w-sm leading-relaxed">
              Pick a track, leave honest feedback, earn +1 credit.
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/25 mb-1">
              {isPro ? "Pro" : "Credits"}
            </p>
            {isPro ? (
              <div className="flex items-center gap-2 justify-end">
                <Crown className="h-5 w-5 text-purple-400" />
                <span className="text-2xl font-black text-purple-400 tabular-nums">{credits}</span>
              </div>
            ) : (
              <p className="text-5xl sm:text-6xl font-black text-white leading-none tabular-nums">
                {credits}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── NOTICES ────────────────────────────────────────────── */}
      {notice === "skipped" && (
        <div className="bg-[#f0f9e8] border-b border-black/8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-black/60">Track skipped.</p>
            <Link href="/review" className="text-xs font-bold text-black/40 hover:text-black transition-colors">
              Dismiss
            </Link>
          </div>
        </div>
      )}
      {(notice === "expired" || notice === "unplayable") && (
        <div className="bg-red-500">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">
              {notice === "expired" ? "Review expired." : "Audio issue reported — removed from your queue."}
            </p>
            <Link href="/review" className="text-xs font-bold text-white/70 hover:text-white transition-colors">
              Dismiss
            </Link>
          </div>
        </div>
      )}

      {/* ── IN PROGRESS ────────────────────────────────────────── */}
      {claimedReviews.length > 0 && (
        <div className="bg-[#1a1a2e] border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 flex-shrink-0">
              In progress
            </p>
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {claimedReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/review/${review.id}/v2`}
                  className="flex items-center gap-2.5 flex-shrink-0 bg-white/6 hover:bg-white/10 border border-white/8 px-3 py-2 transition-colors group"
                >
                  <div className="w-7 h-7 overflow-hidden flex-shrink-0 relative bg-white/10">
                    {review.Track.artworkUrl ? (
                      <Image src={review.Track.artworkUrl} alt={review.Track.title} fill className="object-cover" sizes="28px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-3 w-3 text-white/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-white/80 truncate max-w-[120px]">{review.Track.title}</p>
                  <ArrowRight className="h-3 w-3 text-white/25 group-hover:text-white/50 flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GRID ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Daily limit */}
        {limitReached && (
          <div className="mb-8 rounded-2xl overflow-hidden border-2 border-purple-600/20">
            {/* Dark header */}
            <div className="bg-[#0f0f18] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-400/80">Daily limit reached</p>
                  </div>
                  <p className="text-lg font-black text-white leading-tight">
                    You&apos;ve reviewed {MAX_REVIEWS_PER_DAY} track{MAX_REVIEWS_PER_DAY === 1 ? "" : "s"} today
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    Pro removes the limit — review as many as you want, earn unlimited credits.
                  </p>
                </div>
                <div className="flex-shrink-0 text-right hidden sm:block">
                  <p className="text-2xl font-black text-white">$24.95</p>
                  <p className="text-[11px] text-white/30 font-bold">/ month</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                {["Unlimited reviews/day", "30 credits every month", "3 active slots", "Priority placement"].map(f => (
                  <p key={f} className="text-[11px] text-white/40 font-medium flex items-center gap-1.5">
                    <span className="text-purple-400">✓</span>{f}
                  </p>
                ))}
              </div>
            </div>
            {/* CTA row */}
            <div className="grid grid-cols-2 bg-white border-t border-black/6">
              <Link
                href="/pro"
                className="flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 transition-colors text-white font-black text-sm"
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade to Pro
              </Link>
              <p className="flex items-center justify-center py-3.5 text-[12px] font-bold text-black/40 text-center px-3">
                Check back tomorrow for {MAX_REVIEWS_PER_DAY} more free review{MAX_REVIEWS_PER_DAY === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        )}

        {available.length === 0 && !limitReached ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 bg-[#0f0f18] flex items-center justify-center mb-5">
              <Music className="h-7 w-7 text-white/30" />
            </div>
            <p className="text-xl font-black text-black">Nothing here right now</p>
            <p className="text-sm text-black/40 mt-2 font-medium max-w-xs leading-relaxed">
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
                artworkUrlB={track.other_Track?.artworkUrl ?? null}
                reviewsRemaining={reviewsRemaining}
                isPriority={true}
                isAbTest={track.isAbTest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
