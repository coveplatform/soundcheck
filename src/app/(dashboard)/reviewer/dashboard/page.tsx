import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Headphones,
  DollarSign,
  Star,
  TrendingUp,
  ArrowRight,
  Music,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { expireAndReassignExpiredQueueEntries, TIER_RATES } from "@/lib/queue";

export const dynamic = 'force-dynamic';

export default async function ReviewerDashboardPage() {
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
    include: {
      genres: true,
      reviews: {
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        include: {
          track: {
            include: {
              genres: true,
            },
          },
        },
        take: 5,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!reviewerProfile) {
    redirect("/reviewer/onboarding");
  }

  if (reviewerProfile.isRestricted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reviewer Dashboard</h1>
          <p className="text-neutral-500">Your reviewer account is restricted.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              You can’t accept or work on new reviews right now. If you believe this is a mistake,
              please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
    redirect("/reviewer/onboarding");
  }

  await expireAndReassignExpiredQueueEntries();

  // Calculate tier progress
  const tierProgress = {
    ROOKIE: {
      next: "VERIFIED",
      reviewsNeeded: 25 - reviewerProfile.totalReviews,
      ratingNeeded: 4.0,
      progress: Math.min((reviewerProfile.totalReviews / 25) * 100, 100),
    },
    VERIFIED: {
      next: "PRO",
      reviewsNeeded: 100 - reviewerProfile.totalReviews,
      ratingNeeded: 4.5,
      progress: Math.min(
        ((reviewerProfile.totalReviews - 25) / 75) * 100,
        100
      ),
    },
    PRO: {
      next: null,
      reviewsNeeded: 0,
      ratingNeeded: 0,
      progress: 100,
    },
  };

  const currentTierProgress = tierProgress[reviewerProfile.tier];
  const pendingReviews = reviewerProfile.reviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reviewer Dashboard</h1>
        <p className="text-neutral-500">
          Discover new music and earn while you listen
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Current Tier</p>
                <p className="text-xl font-bold">{reviewerProfile.tier}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Headphones className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Reviews</p>
                <p className="text-xl font-bold">{reviewerProfile.totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Average Rating</p>
                <p className="text-xl font-bold">
                  {reviewerProfile.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Balance</p>
                <p className="text-xl font-bold">
                  {formatCurrency(reviewerProfile.pendingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {currentTierProgress.next && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progress to {currentTierProgress.next}
              </span>
              <span className="text-sm text-neutral-500">
                {currentTierProgress.reviewsNeeded > 0
                  ? `${currentTierProgress.reviewsNeeded} more reviews needed`
                  : "Reviews complete!"}
                {reviewerProfile.averageRating < currentTierProgress.ratingNeeded &&
                  ` (need ${currentTierProgress.ratingNeeded}+ rating)`}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${currentTierProgress.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-400">
              <span>{reviewerProfile.tier}</span>
              <span>
                Earns {formatCurrency(TIER_RATES[reviewerProfile.tier])}/review
              </span>
              <span>{currentTierProgress.next}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tracks to Review</CardTitle>
          {pendingReviews.length > 0 && (
            <Link href="/reviewer/queue">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="font-medium text-neutral-900">No tracks to review</h3>
              <p className="text-sm text-neutral-500 mt-1">
                New tracks matching your genres will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/reviewer/review/${review.id}`}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Music className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium">{review.track.title}</p>
                      <p className="text-sm text-neutral-500">
                        {review.track.genres.map((g) => g.name).join(", ")}
                      </p>
                    </div>
                  </div>
                  <Button size="sm">
                    Review
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Genres */}
      <Card>
        <CardHeader>
          <CardTitle>Your Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {reviewerProfile.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1.5 bg-neutral-100 rounded-full text-sm font-medium"
              >
                {genre.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
