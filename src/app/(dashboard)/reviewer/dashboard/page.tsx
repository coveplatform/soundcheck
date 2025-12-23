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
import { GenreTagList } from "@/components/ui/genre-tag";
import {
  expireAndReassignExpiredQueueEntries,
  TIER_RATES,
  assignReviewersToRecentTracks,
} from "@/lib/queue";

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

  const bypassPayments =
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_PAYMENTS === "true";

  const baseReviewer = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      isRestricted: true,
      completedOnboarding: true,
      onboardingQuizPassed: true,
    },
  });

  if (!baseReviewer) {
    redirect("/reviewer/onboarding");
  }

  if (baseReviewer.isRestricted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Reviewer Dashboard</h1>
          <p className="text-neutral-600">Your reviewer account is restricted.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              You can&apos;t accept or work on new reviews right now. If you believe this is a mistake,
              {" "}
              <Link href="/support" className="font-bold hover:underline underline-offset-4">
                contact support
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!baseReviewer.completedOnboarding || !baseReviewer.onboardingQuizPassed) {
    redirect("/reviewer/onboarding");
  }

  await expireAndReassignExpiredQueueEntries();
  if (bypassPayments) {
    await assignReviewersToRecentTracks();
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
        <h1 className="text-2xl font-black">Reviewer Dashboard</h1>
        <p className="text-neutral-600">
          Discover new music and earn while you listen
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-400 border-2 border-black flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 font-medium">Current Tier</p>
                <p className="text-2xl font-black">{reviewerProfile.tier}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Link href="/reviewer/history" className="block">
          <Card interactive>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-400 border-2 border-black flex items-center justify-center">
                  <Headphones className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600 font-medium">Total Reviews</p>
                  <p className="text-2xl font-black">{reviewerProfile.totalReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center">
                <Star className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 font-medium">Avg Rating</p>
                <p className="text-2xl font-black">
                  {reviewerProfile.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 font-medium">Balance</p>
                <p className="text-2xl font-black">
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
              <span className="text-sm font-bold">
                Progress to {currentTierProgress.next}
              </span>
              <span className="text-sm text-neutral-600 font-mono">
                {currentTierProgress.reviewsNeeded > 0
                  ? `${currentTierProgress.reviewsNeeded} more reviews`
                  : "Reviews complete!"}
                {reviewerProfile.averageRating < currentTierProgress.ratingNeeded &&
                  ` (need ${currentTierProgress.ratingNeeded}+ rating)`}
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-200 border border-black">
              <div
                className="h-full bg-purple-400 transition-all"
                style={{ width: `${currentTierProgress.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-600 font-mono">
              <span>{reviewerProfile.tier}</span>
              <span>
                {formatCurrency(TIER_RATES[reviewerProfile.tier])}/review
              </span>
              <span>{currentTierProgress.next}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Tracks to Review</CardTitle>
          {pendingReviews.length > 0 && (
            <Link href="/reviewer/queue">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-black">
              <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-black">No tracks to review</h3>
              <p className="text-sm text-neutral-600 mt-1">
                New tracks matching your genres will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/reviewer/review/${review.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-2 border-black hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-neutral-100 border-2 border-black flex items-center justify-center">
                      <Music className="h-5 w-5 text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{review.track.title}</p>
                      <GenreTagList
                        genres={review.track.genres}
                        variant="reviewer"
                        size="sm"
                        maxDisplay={2}
                      />
                    </div>
                  </div>
                  <Button size="sm" variant="primary" className="w-full sm:w-auto">
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
          <GenreTagList
            genres={reviewerProfile.genres}
            variant="reviewer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
