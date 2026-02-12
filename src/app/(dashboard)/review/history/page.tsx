import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import Image from "next/image";
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

  // Allow access if either profile completed onboarding
  const hasCompletedOnboarding =
    artistProfile?.completedOnboarding ||
    (reviewerProfile?.completedOnboarding && reviewerProfile?.onboardingQuizPassed);

  if (!hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  // Query both legacy reviews (reviewerId) and peer reviews (peerReviewerArtistId)
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

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="border border-black/8 rounded-xl bg-white/60 p-6">
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
                  className="flex items-center gap-0 rounded-xl border border-black/8 bg-white overflow-hidden transition-all duration-150 ease-out hover:border-black/12 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:translate-y-0 active:shadow-none motion-reduce:transition-none motion-reduce:transform-none"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative">
                    {review.Track.artworkUrl ? (
                      <Image src={review.Track.artworkUrl} alt={review.Track.title} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <Music className="h-5 w-5 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 flex-1 min-w-0 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-black truncate">{review.Track.title}</p>
                      <p className="text-sm text-neutral-600 truncate">
                        {review.Track.Genre.map((g) => g.name).join(", ")}
                        {review.Track.ArtistProfile?.artistName ? ` · ${review.Track.ArtistProfile.artistName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-lime-600">{formatCurrency(review.paidAmount)}</p>
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
