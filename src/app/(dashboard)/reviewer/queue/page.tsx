import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireAndReassignExpiredQueueEntries, assignReviewersToRecentTracks, assignTracksToTestReviewer } from "@/lib/queue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, ArrowRight, Headphones } from "lucide-react";
import { GenreTagList } from "@/components/ui/genre-tag";
import { EmptyState } from "@/components/ui/empty-state";

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

  const listenerProfile = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
  });

  // For test reviewers, assign all available tracks to them
  if (listenerProfile && user?.email) {
    await assignTracksToTestReviewer(listenerProfile.id, user.email);
  }

  if (!listenerProfile) {
    redirect("/listener/onboarding");
  }

  if (listenerProfile.isRestricted) {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Queue</h1>
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

  if (!listenerProfile.completedOnboarding || !listenerProfile.onboardingQuizPassed) {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Queue</h1>
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

  // Get pending reviews (exclude reviews for completed tracks)
  const pendingReviews = await prisma.review.findMany({
    where: {
      reviewerId: listenerProfile.id,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      track: {
        status: { not: "COMPLETED" },
      },
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
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      {/* Notices */}
      {notice === "skipped" && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-medium text-black">Track skipped.</p>
          <p className="text-sm text-black/50 mt-1">We removed it from your queue and reassigned it.</p>
          <Link href="/listener/queue" className="text-sm font-medium text-orange-600 hover:text-orange-800 mt-2 inline-block">
            Dismiss
          </Link>
        </div>
      )}

      {notice === "expired" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-black">Review expired.</p>
          <p className="text-sm text-black/50 mt-1">This review timed out and was reassigned.</p>
          <Link href="/listener/queue" className="text-sm font-medium text-red-600 hover:text-red-800 mt-2 inline-block">
            Dismiss
          </Link>
        </div>
      )}

      {notice === "unplayable" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-black">Audio issue reported.</p>
          <p className="text-sm text-black/50 mt-1">We removed it from your queue and reassigned it.</p>
          <Link href="/listener/queue" className="text-sm font-medium text-red-600 hover:text-red-800 mt-2 inline-block">
            Dismiss
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Queue</h1>
        <p className="mt-2 text-sm text-black/40">
          {pendingReviews.length} track{pendingReviews.length !== 1 ? "s" : ""} waiting for feedback
        </p>
      </div>

      {/* Queue */}
      <Card variant="soft" elevated>
        <CardContent className="pt-6">
          <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">tracks to listen</p>
          
          {pendingReviews.length === 0 ? (
            <EmptyState
              doodle="headphones"
              title="Queue is empty"
              description="New tracks matching your genres will appear here"
              className="py-12"
            />
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{review.track.title}</p>
                      <div className="flex items-center gap-2">
                        <GenreTagList
                          genres={review.track.genres}
                          variant="reviewer"
                          size="sm"
                          maxDisplay={2}
                        />
                        {review.status === "IN_PROGRESS" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            In progress
                          </span>
                        )}
                      </div>
                      {review.track.feedbackFocus && (
                        <p className="text-xs text-amber-600 mt-1">
                          Note: {review.track.feedbackFocus}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={`/listener/review/${review.id}`} className="flex-shrink-0">
                    <Button variant="airyOutline" className="h-9 px-4">
                      Listen
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
