import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plus, Clock, CheckCircle, AlertCircle, Gift, CreditCard, DollarSign } from "lucide-react";
import { GenreTagList } from "@/components/ui/genre-tag";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";

export const dynamic = 'force-dynamic';

export default async function ArtistDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if artist has a profile
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      tracks: {
        include: {
          genres: true,
          reviews: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!artistProfile) {
    redirect("/artist/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  // Calculate stats
  const totalTracks = artistProfile.tracks.length;
  const activeSubmissions = artistProfile.tracks.filter(
    (t) => t.status === "QUEUED" || t.status === "IN_PROGRESS"
  ).length;
  const completedTracks = artistProfile.tracks.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      {!user?.emailVerified && (
        <VerifyEmailBanner />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black">Welcome back, {artistProfile.artistName}</h1>
          <p className="text-neutral-600">Manage your tracks and view feedback</p>
        </div>
        <Link href="/artist/submit">
          <Button variant="primary" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Submit Track
          </Button>
        </Link>
      </div>

      {/* Free Credit Banner */}
      {artistProfile.freeReviewCredits > 0 && (
        <Card className="bg-lime-100 border-lime-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
                <Gift className="h-6 w-6 text-black" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-black">You have {artistProfile.freeReviewCredits} free review{artistProfile.freeReviewCredits > 1 ? "s" : ""}!</p>
                <p className="text-sm text-neutral-700">
                  Submit a track to use your free review credit.
                </p>
              </div>
              <Link href="/artist/submit">
                <Button variant="primary" size="sm">
                  Use Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-neutral-100 border-2 border-black flex items-center justify-center">
                <Music className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-3xl font-black">{totalTracks}</p>
                <p className="text-sm text-neutral-600 font-medium">Total Tracks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-3xl font-black">{activeSubmissions}</p>
                <p className="text-sm text-neutral-600 font-medium">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-3xl font-black">{completedTracks}</p>
                <p className="text-sm text-neutral-600 font-medium">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-400 border-2 border-black flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-3xl font-black">${(artistProfile.totalEarnings / 100).toFixed(2)}</p>
                <p className="text-sm text-neutral-600 font-medium">Track Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Card - Show when there are earnings */}
      {artistProfile.pendingBalance > 0 && (
        <Card className="bg-emerald-50 border-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-400 border-2 border-black flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="font-bold text-black">You have ${(artistProfile.pendingBalance / 100).toFixed(2)} from track sales</p>
                  <p className="text-sm text-neutral-700">
                    Reviewers purchased your tracks! Payout coming soon.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Track List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          {artistProfile.tracks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-black">
              <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-black">No tracks yet</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-4">
                Submit your first track to get feedback
              </p>
              <Link href="/artist/submit">
                <Button variant="primary">Submit Your First Track</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y-2 divide-black border-t-2 border-black">
              {artistProfile.tracks.map((track) => {
                const completedReviews = track.reviews.filter(
                  (r) => r.status === "COMPLETED"
                ).length;
                const progress = Math.round(
                  (completedReviews / track.reviewsRequested) * 100
                );

                return (
                  <Link
                    key={track.id}
                    href={`/artist/tracks/${track.id}`}
                    className="block py-4 hover:bg-neutral-50 -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-black" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{track.title}</p>
                          <GenreTagList
                            genres={track.genres}
                            variant="artist"
                            size="sm"
                            maxDisplay={2}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Action for pending payment */}
                        {track.status === "PENDING_PAYMENT" && (
                          <Link href={`/artist/submit/checkout?trackId=${track.id}`}>
                            <Button size="sm" variant="outline" className="hidden sm:flex border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                              Pay Now
                            </Button>
                          </Link>
                        )}

                        {/* Progress */}
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold">
                            {completedReviews}/{track.reviewsRequested} reviews
                          </p>
                          <div className="w-24 h-2 bg-neutral-200 border border-black mt-1">
                            <div
                              className="h-full bg-lime-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Status Badge */}
                        <StatusBadge status={track.status} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    PENDING_PAYMENT: {
      label: "Pending Payment",
      className: "bg-orange-400 text-black border-black",
      icon: AlertCircle,
    },
    QUEUED: {
      label: "Queued",
      className: "bg-blue-400 text-black border-black",
      icon: Clock,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-purple-400 text-black border-black",
      icon: Clock,
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-lime-500 text-black border-black",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-neutral-200 text-black border-black",
      icon: AlertCircle,
    },
  };

  const config = configs[status as keyof typeof configs] || configs.QUEUED;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 border-2 text-xs font-bold ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
