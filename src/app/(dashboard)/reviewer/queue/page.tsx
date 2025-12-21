import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireAndReassignExpiredQueueEntries } from "@/lib/queue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, ArrowRight, Clock } from "lucide-react";

export default async function ReviewQueuePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await expireAndReassignExpiredQueueEntries();

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!reviewerProfile) {
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
      <div>
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <p className="text-neutral-500">
          {pendingReviews.length} track{pendingReviews.length !== 1 ? "s" : ""} waiting for review
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracks to Review</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="font-medium text-neutral-900">Queue is empty</h3>
              <p className="text-sm text-neutral-500 mt-1">
                New tracks matching your genres will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music className="h-6 w-6 text-neutral-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{review.track.title}</p>
                        <p className="text-sm text-neutral-500 truncate">
                          {review.track.genres.map((g) => g.name).join(", ")}
                        </p>
                        {review.track.feedbackFocus && (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Focus: {review.track.feedbackFocus}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.status === "IN_PROGRESS" && (
                          <span className="text-xs text-amber-600">
                            In Progress
                          </span>
                        )}
                      </div>
                      <Link href={`/reviewer/review/${review.id}`}>
                        <Button>
                          Review
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
