import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Music, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ReviewHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const reviewerProfile = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
  });

  if (!reviewerProfile) {
    redirect("/onboarding");
  }

  if (reviewerProfile.isRestricted) {
    redirect("/dashboard");
  }

  if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
    redirect("/onboarding");
  }

  const reviews = await prisma.review.findMany({
    where: {
      reviewerId: reviewerProfile.id,
      status: "COMPLETED",
    },
    select: {
      id: true,
      createdAt: true,
      paidAmount: true,
      artistRating: true,
      track: {
        select: {
          title: true,
          genres: true,
          artist: { select: { artistName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-neutral-200">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">Review</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black mt-2">
            Review History
          </h1>
          <p className="text-sm text-neutral-600 mt-3">
            {reviews.length} completed review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase mb-4">
            Past Reviews
          </p>

          {reviews.length === 0 ? (
            <EmptyState
              doodle="star"
              title="No completed reviews yet"
              description="Your submitted reviews will show up here."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/listener/review/${review.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 shadow-sm transition-all duration-150 hover:shadow-md hover:border-neutral-300"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-black truncate">{review.track.title}</p>
                      <p className="text-sm text-neutral-600 truncate">
                        {review.track.genres.map((g) => g.name).join(", ")}
                        {review.track.artist?.artistName ? ` · ${review.track.artist.artistName}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(review.paidAmount)}</p>
                      <div className="flex items-center justify-end gap-0.5 mt-1">
                        {review.artistRating !== null && review.artistRating !== undefined ? (
                          [1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={
                                i <= (review.artistRating ?? 0)
                                  ? "h-3.5 w-3.5 text-amber-500 fill-amber-500"
                                  : "h-3.5 w-3.5 text-neutral-300"
                              }
                            />
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">No rating</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 font-medium">
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
    </div>
  );
}
