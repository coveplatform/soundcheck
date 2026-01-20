import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Music, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ReviewerHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, email: true },
  });

  if (!user?.emailVerified) {
    const email = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    redirect(`/verify-email${email}`);
  }

  const reviewerProfile = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
  });

  if (!reviewerProfile) {
    redirect("/listener/onboarding");
  }

  if (reviewerProfile.isRestricted) {
    redirect("/listener/dashboard");
  }

  if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
    redirect("/listener/onboarding");
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
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">History</h1>
        <p className="mt-2 text-sm text-black/40">
          {reviews.length} completed review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Card variant="soft" elevated>
        <CardContent className="pt-6">
          <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">past reviews</p>
          
          {reviews.length === 0 ? (
            <EmptyState
              doodle="star"
              title="No completed reviews yet"
              description="Your submitted reviews will show up here."
              className="py-12"
            />
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/listener/review/${review.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3 hover:bg-white transition-colors duration-150 ease-out"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{review.track.title}</p>
                      <p className="text-xs text-black/40 truncate">
                        {review.track.genres.map((g) => g.name).join(", ")}
                        {review.track.artist?.artistName ? ` · ${review.track.artist.artistName}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-emerald-600">{formatCurrency(review.paidAmount)}</p>
                      <div className="flex items-center justify-end gap-0.5 mt-0.5">
                        {review.artistRating !== null && review.artistRating !== undefined ? (
                          [1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={
                                i <= (review.artistRating ?? 0)
                                  ? "h-3 w-3 text-amber-500 fill-amber-500"
                                  : "h-3 w-3 text-black/20"
                              }
                            />
                          ))
                        ) : (
                          <span className="text-xs text-black/30">No rating</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-black/40">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
