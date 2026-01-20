import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Headphones,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { GenreTagList } from "@/components/ui/genre-tag";
import {
  expireAndReassignExpiredQueueEntries,
  getTierRateCents,
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

  const baseReviewer = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      isRestricted: true,
      completedOnboarding: true,
      onboardingQuizPassed: true,
    },
  });

  if (!baseReviewer) {
    redirect("/listener/onboarding");
  }

  if (baseReviewer.isRestricted) {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Home</h1>
          <p className="mt-2 text-sm text-black/40">Your listener account is restricted.</p>
        </div>
        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <p className="text-xs font-mono tracking-widest text-black/40 uppercase">access restricted</p>
            <p className="mt-3 text-sm text-black/50">
              You can&apos;t accept or work on new reviews right now. If you believe this is a mistake,
              {" "}
              <Link href="/support" className="font-medium text-black hover:underline underline-offset-4">
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
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Home</h1>
          <p className="mt-2 text-sm text-black/40">Finish onboarding to start listening.</p>
        </div>

        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <p className="text-xs font-mono tracking-widest text-black/40 uppercase">next</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-light tracking-tight">Finish onboarding</h2>
            <p className="mt-2 text-sm text-black/50 max-w-prose">
              Complete the quiz and select your genres before you can access the review queue.
            </p>
            <div className="mt-6">
              <Link href="/listener/onboarding">
                <Button variant="airyPrimary" className="h-12 px-6">
                  Continue onboarding
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  await expireAndReassignExpiredQueueEntries();
  if (bypassPayments) {
    await assignReviewersToRecentTracks();
  }

  const reviewerProfile = await prisma.listenerProfile.findUnique({
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
    redirect("/listener/onboarding");
  }

  // Calculate tier progress
  const reviewsNeeded = Math.max(0, 50 - reviewerProfile.totalReviews);
  const gemsNeeded = Math.max(0, 10 - (reviewerProfile.gemCount ?? 0));

  const reviewProgress = Math.min((reviewerProfile.totalReviews / 50) * 100, 100);
  const gemProgress = Math.min(((reviewerProfile.gemCount ?? 0) / 10) * 100, 100);

  const tierProgress = {
    NORMAL: {
      next: "PRO",
      reviewsNeeded,
      ratingNeeded: 4.7,
      gemsNeeded,
      progress: Math.max(reviewProgress, gemProgress),
    },
    PRO: {
      next: null,
      reviewsNeeded: 0,
      ratingNeeded: 0,
      gemsNeeded: 0,
      progress: 100,
    },
  };

  const tierKey = reviewerProfile.tier === "PRO" ? "PRO" : "NORMAL";
  const currentTierProgress = tierProgress[tierKey];
  const pendingReviews = reviewerProfile.reviews;

  // Determine next action
  const nextAction = (() => {
    if (pendingReviews.length > 0) {
      return {
        title: "Listen to tracks",
        description: `You have ${pendingReviews.length} track${pendingReviews.length !== 1 ? "s" : ""} waiting for your feedback.`,
        href: "/listener/queue",
        cta: "Open queue",
      };
    }
    return {
      title: "Queue is empty",
      description: "New tracks matching your genres will appear here soon.",
      href: "/listener/queue",
      cta: "Check queue",
    };
  })();

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Home</h1>
        <p className="mt-2 text-sm text-black/40">
          Discover new music and earn while you listen.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          {/* Next Action Card */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">next</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-light tracking-tight">{nextAction.title}</h2>
              <p className="mt-2 text-sm text-black/50 max-w-prose">{nextAction.description}</p>
              <div className="mt-6">
                <Link href={nextAction.href}>
                  <Button variant="airyPrimary" className="h-12 px-6">
                    {nextAction.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">reviews</p>
                <p className="mt-2 text-3xl font-light tracking-tight">{reviewerProfile.totalReviews}</p>
                <p className="mt-1 text-sm text-black/40">completed</p>
              </CardContent>
            </Card>

            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">rating</p>
                <p className="mt-2 text-3xl font-light tracking-tight">{reviewerProfile.averageRating.toFixed(1)}</p>
                <p className="mt-1 text-sm text-black/40">average</p>
              </CardContent>
            </Card>

            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">queue</p>
                <p className="mt-2 text-3xl font-light tracking-tight">{pendingReviews.length}</p>
                <p className="mt-1 text-sm text-black/40">waiting</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Reviews */}
          {pendingReviews.length > 0 && (
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-xs font-mono tracking-widest text-black/40 uppercase">tracks to listen</p>
                  <Link href="/listener/queue" className="text-xs text-black/40 hover:text-black transition-colors">
                    View all
                  </Link>
                </div>

                <div className="mt-4 grid gap-3">
                  {pendingReviews.slice(0, 3).map((review: any) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Headphones className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate">{review.track.title}</p>
                          <GenreTagList
                            genres={review.track.genres}
                            variant="reviewer"
                            size="sm"
                            maxDisplay={2}
                          />
                        </div>
                      </div>
                      <Link href={`/listener/review/${review.id}`} className="flex-shrink-0">
                        <Button variant="airyOutline" className="h-9 px-4">
                          Listen
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pendingReviews.length === 0 && (
            <Card variant="soft">
              <CardContent className="pt-6">
                <EmptyState
                  doodle="headphones"
                  title="No tracks to listen"
                  description="New tracks matching your genres will appear here"
                  className="py-8"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Earnings Card */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">balance</p>
              <p className="mt-2 text-3xl font-light tracking-tight">{formatCurrency(reviewerProfile.pendingBalance)}</p>
              <p className="mt-1 text-sm text-black/40">
                {formatCurrency(getTierRateCents(reviewerProfile.tier))}/review · {reviewerProfile.tier} tier
              </p>
              <div className="mt-4">
                <Link href="/listener/earnings">
                  <Button variant="airyOutline" className="h-10 px-4">
                    View earnings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tier Progress */}
          {currentTierProgress.next && (
            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">progress to {currentTierProgress.next}</p>
                <div className="mt-3">
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-[width] duration-150 ease-out"
                      style={{ width: `${currentTierProgress.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-black/50">
                    {currentTierProgress.reviewsNeeded > 0
                      ? `${currentTierProgress.reviewsNeeded} more reviews needed`
                      : "Reviews complete!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Genres */}
          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">your genres</p>
              <div className="mt-3">
                <GenreTagList
                  genres={reviewerProfile.genres}
                  variant="reviewer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
