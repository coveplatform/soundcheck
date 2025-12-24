import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Clock, Music, Star } from "lucide-react";

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

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true },
  });

  if (!reviewerProfile) {
    redirect("/reviewer/onboarding");
  }

  if (reviewerProfile.isRestricted) {
    redirect("/reviewer/dashboard");
  }

  if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
    redirect("/reviewer/onboarding");
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Review History</h1>
        <p className="text-neutral-600">
          {reviews.length} completed review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Card>
        <CardHeader className="border-b-2 border-black">
          <CardTitle>Past Reviews</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-black">No completed reviews yet</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Your submitted reviews will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/reviewer/review/${review.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                      <Music className="h-6 w-6 text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{review.track.title}</p>
                      <p className="text-sm text-neutral-600 truncate">
                        {review.track.genres.map((g) => g.name).join(", ")}
                        {review.track.artist?.artistName ? `  ${review.track.artist.artistName}` : ""}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-neutral-600 font-mono mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-neutral-600 font-mono">Earned</p>
                      <p className="font-black">{formatCurrency(review.paidAmount)}</p>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        {review.artistRating !== null && review.artistRating !== undefined ? (
                          [1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={
                                i <= (review.artistRating ?? 0)
                                  ? "h-4 w-4 text-amber-500 fill-amber-500"
                                  : "h-4 w-4 text-neutral-300"
                              }
                            />
                          ))
                        ) : (
                          <span className="text-xs text-neutral-500 font-mono">No rating</span>
                        )}
                      </div>
                    </div>
                    <div className="h-10 w-10 bg-black text-white border-2 border-black flex items-center justify-center">
                      <ArrowRight className="h-5 w-5" />
                    </div>
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
