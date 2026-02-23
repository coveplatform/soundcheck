import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Music, Star, ArrowLeft } from "lucide-react";
import {
  StarDoodle,
  DotsDoodle,
} from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

export default async function ReviewHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [reviewerProfile, artistProfile] = await Promise.all([
    prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
    }),
    prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, completedOnboarding: true },
    }),
  ]);

  if (!reviewerProfile && !artistProfile) {
    redirect("/onboarding");
  }

  if (reviewerProfile?.isRestricted) {
    redirect("/dashboard");
  }

  const hasCompletedOnboarding =
    artistProfile?.completedOnboarding ||
    (reviewerProfile?.completedOnboarding && reviewerProfile?.onboardingQuizPassed);

  if (!hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  const orConditions: any[] = [];
  if (reviewerProfile) {
    orConditions.push({ reviewerId: reviewerProfile.id });
  }
  if (artistProfile) {
    orConditions.push({ peerReviewerArtistId: artistProfile.id });
  }

  const reviews = await prisma.review.findMany({
    where: {
      OR: orConditions,
      status: "COMPLETED",
    },
    select: {
      id: true,
      createdAt: true,
      paidAmount: true,
      artistRating: true,
      Track: {
        select: {
          title: true,
          artworkUrl: true,
          Genre: true,
          ArtistProfile: { select: { artistName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Tally total earned
  const totalEarned = reviews.reduce((sum, r) => sum + (r.paidAmount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <StarDoodle className="absolute -top-3 right-[30%] w-14 h-14 text-purple-400/20 pointer-events-none" />
          <DotsDoodle className="absolute bottom-2 right-6 w-12 h-12 text-purple-400/15 pointer-events-none" />

          <div className="flex items-start justify-between gap-6 relative">
            <div className="min-w-0">
              <Link
                href="/review"
                className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mb-3"
              >
                <ArrowLeft className="h-3 w-3" />
                Review Queue
              </Link>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Review History.
              </h1>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">
                {reviews.length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                {reviews.length === 1 ? "review" : "reviews"} done
              </p>
            </div>
          </div>

          {/* Stats row */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-4 mt-6 pt-5 border-t-2 border-black/8 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-black tabular-nums">{reviews.length}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-black/35">completed</span>
              </div>
              {totalEarned > 0 && (
                <>
                  <span className="text-black/15 font-black">·</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-black tabular-nums">{formatCurrency(totalEarned)}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-black/35">earned</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── REVIEW LIST ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {reviews.length === 0 ? (
          <div className="border-2 border-black/8 rounded-2xl px-6 py-16 text-center bg-white/40">
            <Star className="h-10 w-10 text-black/15 mx-auto mb-3" />
            <p className="text-base font-bold text-black/40">No completed reviews yet.</p>
            <p className="text-sm text-black/25 mt-1">Your submitted reviews will show up here.</p>
            <Link
              href="/review"
              className="inline-block mt-4 text-[11px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-800 transition-colors"
            >
              Go to queue →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Link
                key={review.id}
                href={`/listener/review/${review.id}`}
                className="flex items-stretch rounded-2xl border-2 border-black/8 bg-white overflow-hidden hover:border-black/15 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative">
                  {review.Track.artworkUrl ? (
                    <Image
                      src={review.Track.artworkUrl}
                      alt={review.Track.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      <Music className="h-5 w-5 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 flex-1 min-w-0 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-black truncate">{review.Track.title}</p>
                    <p className="text-sm text-black/40 truncate">
                      {review.Track.Genre.map((g) => g.name).join(", ")}
                      {review.Track.ArtistProfile?.artistName
                        ? ` · ${review.Track.ArtistProfile.artistName}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      {review.paidAmount != null && review.paidAmount > 0 && (
                        <p className="text-sm font-black text-lime-600">
                          {formatCurrency(review.paidAmount)}
                        </p>
                      )}
                      <div className="flex items-center justify-end gap-0.5 mt-1">
                        {review.artistRating !== null && review.artistRating !== undefined ? (
                          [1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={
                                i <= (review.artistRating ?? 0)
                                  ? "h-3.5 w-3.5 text-amber-500 fill-amber-500"
                                  : "h-3.5 w-3.5 text-neutral-200"
                              }
                            />
                          ))
                        ) : (
                          <span className="text-xs text-black/20 font-medium">No rating</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-black/30 font-medium whitespace-nowrap">
                      {formatRelativeDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
