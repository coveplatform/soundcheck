import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {artistProfile.artistName}</h1>
          <p className="text-neutral-500">Manage your tracks and view feedback</p>
        </div>
        <Link href="/artist/submit">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Submit Track
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTracks}</p>
                <p className="text-sm text-neutral-500">Total Tracks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSubmissions}</p>
                <p className="text-sm text-neutral-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTracks}</p>
                <p className="text-sm text-neutral-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Track List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          {artistProfile.tracks.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="font-medium text-neutral-900">No tracks yet</h3>
              <p className="text-sm text-neutral-500 mt-1 mb-4">
                Submit your first track to get feedback
              </p>
              <Link href="/artist/submit">
                <Button>Submit Your First Track</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
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
                    className="block py-4 hover:bg-neutral-50 -mx-6 px-6 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-neutral-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <span>
                              {track.genres.map((g) => g.name).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Progress */}
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium">
                            {completedReviews}/{track.reviewsRequested} reviews
                          </p>
                          <div className="w-24 h-1.5 bg-neutral-100 rounded-full mt-1">
                            <div
                              className="h-full bg-neutral-900 rounded-full"
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
      className: "bg-amber-100 text-amber-700",
      icon: AlertCircle,
    },
    QUEUED: {
      label: "Queued",
      className: "bg-blue-100 text-blue-700",
      icon: Clock,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-purple-100 text-purple-700",
      icon: Clock,
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-green-100 text-green-700",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-neutral-100 text-neutral-700",
      icon: AlertCircle,
    },
  };

  const config = configs[status as keyof typeof configs] || configs.QUEUED;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
