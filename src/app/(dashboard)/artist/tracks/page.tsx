import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Music, DollarSign, MessageSquare, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ArtistTracksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

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
          purchases: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!artistProfile) {
    redirect("/artist/onboarding");
  }

  const tracks = artistProfile.tracks;
  const totalEarnings = artistProfile.totalEarnings / 100;
  const pendingBalance = artistProfile.pendingBalance / 100;

  return (
    <div className="pt-16 px-6 sm:px-8 lg:px-12 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-neutral-200">
          <div>
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">Tracks</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-500">{tracks.length} {tracks.length === 1 ? "Track" : "Tracks"}</span>
              {totalEarnings > 0 && (
                <>
                  <span className="text-neutral-300">•</span>
                  <span className="font-semibold text-teal-600">${totalEarnings.toFixed(2)} earned</span>
                </>
              )}
            </div>
          </div>

          {pendingBalance > 0 && (
            <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-sm font-bold text-purple-700">${pendingBalance.toFixed(2)} pending</span>
            </div>
          )}
        </div>

        {tracks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            <Link
              href="/artist/submit"
              className="group aspect-square"
            >
              <Card
                variant="soft"
                interactive
                className="h-full border-2 border-dashed border-black/10 bg-white/40 hover:bg-white/60 hover:border-black/20"
              >
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-black/5 group-hover:bg-black flex items-center justify-center transition-colors duration-150 ease-out motion-reduce:transition-none">
                    <Plus className="h-5 w-5 text-black/40 group-hover:text-white transition-colors duration-150 ease-out motion-reduce:transition-none" />
                  </div>
                  <span className="text-sm text-black/50 group-hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none">
                    Upload track
                  </span>
                </div>
              </Card>
            </Link>

            {tracks.map((track) => {
              const completedReviews = track.reviews.filter(
                (r) => r.status === "COMPLETED"
              ).length;
              const totalPurchases =
                track.purchases.reduce((sum, p) => sum + p.amount, 0) / 100;
              const hasReviews = track.reviewsRequested > 0;
              const reviewProgress = hasReviews
                ? completedReviews / track.reviewsRequested
                : 0;

              return (
                <TrackCard
                  key={track.id}
                  id={track.id}
                  title={track.title}
                  artworkUrl={track.artworkUrl}
                  status={track.status}
                  hasReviews={hasReviews}
                  reviewProgress={reviewProgress}
                  completedReviews={completedReviews}
                  totalReviews={track.reviewsRequested}
                  earnings={totalPurchases}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TrackCard({
  id,
  title,
  artworkUrl,
  status,
  hasReviews,
  reviewProgress,
  completedReviews,
  totalReviews,
  earnings,
}: {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  hasReviews: boolean;
  reviewProgress: number;
  completedReviews: number;
  totalReviews: number;
  earnings: number;
}) {
  const isPending = status === "PENDING_PAYMENT";
  const isReviewing = status === "IN_PROGRESS" || status === "QUEUED";
  const isComplete = status === "COMPLETED";
  const isUploaded = status === "UPLOADED";

  const statusLabel = isUploaded
    ? "Uploaded"
    : isPending
      ? "Payment pending"
      : isComplete
        ? "Completed"
        : isReviewing
          ? "Reviewing"
          : null;

  return (
    <Link href={`/artist/tracks/${id}`} className="group block">
      <Card variant="soft" interactive className="overflow-hidden">
        <div className="relative aspect-square bg-neutral-100">
          {artworkUrl ? (
            <Image
              src={artworkUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
              <Music className="h-10 w-10 text-black/20" />
            </div>
          )}

          {isComplete ? (
            <div className="absolute top-2 left-2 -rotate-3">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-400 to-purple-500 border-2 border-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="h-4 w-4 bg-white text-purple-600 flex items-center justify-center rounded-sm">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                </div>
                <span className="text-[9px] font-black tracking-wide uppercase">Done</span>
                <Sparkles className="h-3 w-3" />
              </div>
            </div>
          ) : statusLabel && (
            <div className="absolute top-3 left-3">
              <span
                className={cn(
                  "inline-flex items-center text-xs px-2.5 py-1 rounded-full border",
                  isPending
                    ? "bg-white/80 text-black border-black/15"
                    : isUploaded
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : "bg-white/70 text-black border-black/10"
                )}
              >
                {statusLabel}
              </span>
            </div>
          )}

          {isReviewing && hasReviews && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="h-1.5 bg-white/35 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-[width] duration-150 ease-out motion-reduce:transition-none"
                  style={{ width: `${reviewProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 space-y-2">
          <h3 className="font-medium text-sm sm:text-base truncate text-black group-hover:text-black/70 transition-colors duration-150 ease-out motion-reduce:transition-none">
            {title}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {hasReviews && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                  isComplete
                    ? "bg-emerald-50 text-emerald-700"
                    : isReviewing
                      ? "bg-violet-50 text-violet-700"
                      : "bg-neutral-100 text-neutral-600"
                )}
              >
                <MessageSquare className="h-3 w-3" />
                {completedReviews}/{totalReviews}
              </span>
            )}

            {earnings > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                <DollarSign className="h-3 w-3" />
                {earnings.toFixed(2)}
              </span>
            )}

            {!hasReviews && earnings === 0 && !isPending && (
              <span
                className={cn(
                  "text-xs",
                  isUploaded ? "text-black/60" : "text-black/30"
                )}
              >
                {isUploaded ? "Request reviews" : "No reviews yet"}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-32">
      <div className="relative mb-8">
        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-neutral-200 transform rotate-6 absolute inset-0" />
        <div
          className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl transform -rotate-3 absolute inset-0"
          style={{ backgroundColor: "#e8e8e8" }}
        />
        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-neutral-100 relative flex items-center justify-center">
          <Music className="h-10 w-10 text-black/20" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-center mb-3">
        Upload your first track
      </h2>
      <p className="text-black/40 text-center max-w-sm mb-8">
        Get it heard by real listeners. Get feedback. Get paid.
      </p>

      <Link href="/artist/submit">
        <Button variant="airyPrimary" className="h-12 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Upload your first track
        </Button>
      </Link>
    </div>
  );
}
