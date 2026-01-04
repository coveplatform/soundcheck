import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireAndReassignExpiredQueueEntries, assignReviewersToRecentTracks } from "@/lib/queue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, ArrowRight, Clock, Headphones } from "lucide-react";
import { GenreTagList } from "@/components/ui/genre-tag";

export const dynamic = 'force-dynamic';

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const notice = resolvedParams.notice;
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

  await expireAndReassignExpiredQueueEntries();

  const bypassPayments =
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_PAYMENTS === "true";

  if (bypassPayments) {
    await assignReviewersToRecentTracks();
  }

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!reviewerProfile) {
    redirect("/reviewer/onboarding");
  }

  if (reviewerProfile.isRestricted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Review Queue</h1>
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

  if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
    redirect("/reviewer/onboarding");
  }

  // Get pending reviews
  const pendingReviews = await prisma.review.findMany({
    where: {
      reviewerId: reviewerProfile.id,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    include: {
      track: {
        include: {
          genres: true,
          artist: {
            select: { artistName: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      {notice === "skipped" ? (
        <div className="border-2 border-black bg-orange-50 p-4">
          <p className="text-sm font-bold text-black">
            Track skipped.
          </p>
          <p className="text-sm text-neutral-700 mt-1">
            We removed it from your queue and reassigned it.
          </p>
          <div className="mt-3">
            <Link href="/reviewer/queue" className="text-sm font-bold hover:underline underline-offset-4">
              Dismiss
            </Link>
          </div>
        </div>
      ) : null}

      {notice === "expired" ? (
        <div className="border-2 border-black bg-red-50 p-4">
          <p className="text-sm font-bold text-black">
            Review expired.
          </p>
          <p className="text-sm text-neutral-700 mt-1">
            This review timed out and was reassigned.
          </p>
          <div className="mt-3">
            <Link href="/reviewer/queue" className="text-sm font-bold hover:underline underline-offset-4">
              Dismiss
            </Link>
          </div>
        </div>
      ) : null}

      {notice === "unplayable" ? (
        <div className="border-2 border-black bg-red-50 p-4">
          <p className="text-sm font-bold text-black">
            Audio issue reported.
          </p>
          <p className="text-sm text-neutral-700 mt-1">
            We removed it from your queue and reassigned it.
          </p>
          <div className="mt-3">
            <Link href="/reviewer/queue" className="text-sm font-bold hover:underline underline-offset-4">
              Dismiss
            </Link>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black">Review Queue</h1>
          <p className="text-neutral-600">
            {pendingReviews.length} track{pendingReviews.length !== 1 ? "s" : ""} waiting for review
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="h-10 w-10 bg-orange-400 border-2 border-black flex items-center justify-center">
            <Headphones className="h-5 w-5 text-black" />
          </div>
          <span className="text-2xl font-black">{pendingReviews.length}</span>
        </div>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader className="border-b-2 border-black">
          <CardTitle>Tracks to Review</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingReviews.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-black">Queue is empty</h3>
              <p className="text-sm text-neutral-600 mt-1">
                New tracks matching your genres will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {pendingReviews.map((review) => (
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
                      <GenreTagList
                        genres={review.track.genres}
                        variant="reviewer"
                        size="sm"
                        maxDisplay={2}
                      />
                      {review.track.feedbackFocus && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          Artist note: {review.track.feedbackFocus}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-neutral-600 font-mono">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.status === "IN_PROGRESS" && (
                        <span className="inline-flex items-center px-2 py-0.5 border-2 border-black bg-purple-400 text-black text-xs font-bold mt-1">
                          In Progress
                        </span>
                      )}
                    </div>
                    <Button variant="primary" size="sm">
                      Review
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
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
