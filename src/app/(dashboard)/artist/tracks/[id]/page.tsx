import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import { TrackUpdateSourceForm } from "@/components/artist/track-update-source-form";
import { TrackFeedbackViewTracker } from "@/components/artist/track-feedback-view-tracker";
import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import { AudioPlayer } from "@/components/audio/audio-player";
import { StemPlayer } from "@/components/audio/stem-player";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import { ProjectStructure } from "@/components/ableton/project-structure";
import { AnimatedSection } from "@/components/landing/animated-section";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ListMusic,
  Music,
  Share2,
  UserPlus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  XCircle,
  Clock,
  FileCode,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch track and platform averages in parallel
  const [track, platformStats] = await Promise.all([
    prisma.track.findUnique({
      where: { id },
      include: {
        artist: {
          include: { user: true },
        },
        genres: true,
        payment: true,
        stems: {
          orderBy: { order: "asc" },
        },
        reviews: {
          where: { status: "COMPLETED" },
          include: {
            reviewer: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    // Get platform-wide averages for context
    prisma.review.aggregate({
      where: {
        status: "COMPLETED",
        countsTowardAnalytics: true,
      },
      _avg: {
        productionScore: true,
        originalityScore: true,
        vocalScore: true,
      },
    }),
  ]);

  if (!track) {
    notFound();
  }

  // Verify ownership
  if (track.artist.userId !== session.user.id) {
    notFound();
  }

  // Check subscription status for trial limitations
  const isSubscribed = track.artist.subscriptionStatus === "active";
  const isTrial = !isSubscribed;

  const completedReviews = track.reviews.length;
  const countedCompletedReviews = track.reviews.filter(
    (r) => r.countsTowardCompletion !== false
  ).length;
  const progress =
    track.reviewsRequested > 0
      ? Math.round((countedCompletedReviews / track.reviewsRequested) * 100)
      : 0;

  // Calculate averages
  const analyticsReviews = isSubscribed
    ? track.reviews.filter((r) => r.countsTowardAnalytics !== false)
    : [];

  // For trial users, limit displayed reviews to 1
  const displayedReviews = isTrial ? track.reviews.slice(0, 1) : track.reviews;

  const avgProduction =
    analyticsReviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) /
    (analyticsReviews.length || 1);
  const avgOriginality =
    analyticsReviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) /
    (analyticsReviews.length || 1);
  const wouldListenAgain = analyticsReviews.filter((r) => r.wouldListenAgain).length;
  const wouldListenAgainPercent = Math.round(
    (wouldListenAgain / (analyticsReviews.length || 1)) * 100
  );

  const isZipUpload =
    track.sourceType === "UPLOAD" &&
    typeof track.sourceUrl === "string" &&
    track.sourceUrl.toLowerCase().endsWith(".zip");

  const hasPlayableStems =
    Boolean(track.hasStems) &&
    Array.isArray(track.stems) &&
    track.stems.length > 0 &&
    track.stems.every(
      (s) => typeof s.stemUrl === "string" && !s.stemUrl.toLowerCase().endsWith(".zip")
    );

  // Listener signals
  const playlistYes = analyticsReviews.filter((r) => r.wouldAddToPlaylist === true).length;
  const playlistTotal = analyticsReviews.filter((r) => r.wouldAddToPlaylist !== null).length;
  const shareYes = analyticsReviews.filter((r) => r.wouldShare === true).length;
  const shareTotal = analyticsReviews.filter((r) => r.wouldShare !== null).length;
  const followYes = analyticsReviews.filter((r) => r.wouldFollow === true).length;
  const followTotal = analyticsReviews.filter((r) => r.wouldFollow !== null).length;
  const hasListenerSignals = playlistTotal > 0 || shareTotal > 0 || followTotal > 0;

  return (
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12">
      <TrackFeedbackViewTracker trackId={track.id} reviewCount={completedReviews} />

      {/* Back Link */}
      <Link
        href="/artist/tracks"
        className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tracks
      </Link>

      {/* Track Header - Hero Style */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Album Art */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex-shrink-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
            {track.status === "COMPLETED" ? (
              <div className="absolute top-3 left-3 -rotate-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-lime-300 via-yellow-200 to-orange-200 border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="h-5 w-5 bg-black text-white flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-black tracking-wide">COMPLETED</span>
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            ) : null}
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-20 h-20 text-white/30" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">Track</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black mt-2 break-words">{track.title}</h1>

            {/* Genre Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {track.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm font-bold text-black"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {(track.status as any) === "UPLOADED" ? (
                <Link href={`/artist/tracks/${track.id}/request-reviews`}>
                  <Button className="bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Request reviews
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : null}

              <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-black hover:bg-black/90 text-white font-bold border-2 border-black">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {track.sourceType === "UPLOAD" ? "Download" : "Open track"}
                </Button>
              </a>

              {track.status === "QUEUED" ? (
                <TrackCancelButton
                  trackId={track.id}
                  willRefund={track.payment?.status === "COMPLETED"}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {track.reviewsRequested > 0 && (
          <div className="flex flex-wrap items-center gap-8 mt-10 pt-8 border-t-2 border-black/10 text-sm">
            <div>
              <span className="text-2xl font-bold text-black">{completedReviews}</span>
              <span className="text-black/50 ml-2 font-medium">reviews</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-black">{progress}%</span>
              <span className="text-black/50 ml-2 font-medium">complete</span>
            </div>
            <div className="w-full">
              <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime-500 transition-all duration-300 ease-out motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Link Issue Warning */}
      {track.linkIssueNotifiedAt && track.status !== "CANCELLED" && (
        <Card
          variant="soft"
          elevated
          className="max-w-5xl mx-auto border border-red-200 bg-red-50 mb-6"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-red-900">Track link issue</p>
                <p className="text-sm text-red-700 mt-1">
                  Your link appears to be broken, private, or unavailable. Reviewers can't listen until this is fixed.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Update the link below to keep reviews flowing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Half - New Linear Layout */}
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
        {/* Section 1: Listen */}
        <AnimatedSection>
          <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
            <CardContent className="pt-6">
              <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest mb-4">Listen</p>
              {hasPlayableStems ? (
                <StemPlayer
                  trackId={track.id}
                  stems={track.stems}
                  showListenTracker={false}
                />
              ) : isZipUpload ? (
                <div className="rounded-xl border-2 border-black bg-white p-4">
                  <p className="text-sm font-bold">Audio will be available after rendering</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    You uploaded an Ableton project ZIP. Once rendering finishes, you&apos;ll be able to play the master and stems here.
                  </p>
                </div>
              ) : (
                <AudioPlayer
                  sourceUrl={track.sourceUrl}
                  sourceType={track.sourceType}
                  showListenTracker={false}
                  showWaveform={track.sourceType === "UPLOAD"}
                />
              )}
              {track.status !== "CANCELLED" && completedReviews === 0 ? (
                <div className="mt-6">
                  <TrackUpdateSourceForm trackId={track.id} initialUrl={track.sourceUrl} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Section 2: About (conditional - project structure or feedback focus) */}
        {(track.abletonProjectData || track.feedbackFocus) && (
          <AnimatedSection>
            <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
              <CardContent className="pt-6 space-y-6">
                <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">About</p>

                {track.feedbackFocus && (
                  <div>
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-2">artist note</p>
                    <p className="text-sm font-bold text-black/80">{track.feedbackFocus}</p>
                  </div>
                )}

                {track.abletonProjectData && (
                  <div>
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-2">project structure</p>
                    <ProjectStructure projectData={track.abletonProjectData as any} />
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Section 3: Feedback (conditional - reviews) */}
        {completedReviews > 0 && (
          <AnimatedSection>
            <div className="space-y-6">
              {/* Analytics - Blurred for trial users */}
              {isTrial ? (
                <div className="relative">
                  <div className="pointer-events-none blur-sm opacity-50">
                    <AggregateAnalytics
                      reviews={[]}
                      platformAverages={{
                        production: platformStats._avg.productionScore ?? 0,
                        originality: platformStats._avg.originalityScore ?? 0,
                        vocals: platformStats._avg.vocalScore ?? 0,
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Card variant="soft" elevated className="max-w-md">
                      <CardContent className="pt-6 text-center">
                        <h3 className="text-xl font-bold text-black mb-2">Upgrade to see full analytics</h3>
                        <p className="text-sm text-black/60 mb-4">
                          Get pattern insights, aggregate scores, and detailed analytics from all {completedReviews} reviews.
                        </p>
                        <Link href="/artist/submit">
                          <Button className="bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold">
                            Upgrade to Standard
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <AggregateAnalytics
                  reviews={analyticsReviews}
                  platformAverages={{
                    production: platformStats._avg.productionScore ?? 0,
                    originality: platformStats._avg.originalityScore ?? 0,
                    vocals: platformStats._avg.vocalScore ?? 0,
                  }}
                />
              )}

              {/* Reviews Carousel - Limited to 1 for trial */}
              <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
                <CardHeader className="sr-only">
                  <CardTitle>Reviews ({completedReviews})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ReviewCarousel reviews={displayedReviews} showControls={!isTrial} />
                </CardContent>
              </Card>

              {/* Trial upgrade prompt after first review */}
              {isTrial && completedReviews > 1 && (
                <Card variant="soft" elevated className="border-2 border-lime-400">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-black mb-2">
                        {completedReviews - 1} more {completedReviews - 1 === 1 ? 'review' : 'reviews'} waiting
                      </h3>
                      <p className="text-sm text-black/60 mb-4">
                        You have {completedReviews} total reviews. Upgrade to see all feedback and unlock full analytics.
                      </p>
                      <Link href="/artist/submit">
                        <Button className="bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                          Upgrade Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* Section 4: Engagement (conditional - listener signals) */}
        {completedReviews > 0 && (
          <AnimatedSection>
            {isTrial ? (
              <div className="relative">
                <div className="pointer-events-none blur-sm opacity-50">
                  <Card variant="airy" className="overflow-hidden rounded-3xl">
                    <CardContent className="pt-6 space-y-6">
                      <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">Engagement</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-500">
                              <ListMusic className="h-6 w-6" />
                            </div>
                          </div>
                          <p className="text-2xl font-black">—</p>
                          <p className="text-sm text-neutral-600">Playlist</p>
                        </div>
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-500">
                              <Share2 className="h-6 w-6" />
                            </div>
                          </div>
                          <p className="text-2xl font-black">—</p>
                          <p className="text-sm text-neutral-600">Share</p>
                        </div>
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-500">
                              <UserPlus className="h-6 w-6" />
                            </div>
                          </div>
                          <p className="text-2xl font-black">—</p>
                          <p className="text-sm text-neutral-600">Follow</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Card variant="soft" elevated className="max-w-md">
                    <CardContent className="pt-6 text-center">
                      <h3 className="text-xl font-bold text-black mb-2">Upgrade to see engagement</h3>
                      <p className="text-sm text-black/60 mb-4">
                        Unlock playlist/share/follow signals across all {completedReviews} reviews.
                      </p>
                      <Link href="/artist/submit">
                        <Button className="bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold">
                          Upgrade to Standard
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : hasListenerSignals ? (
              <Card variant="airy" className="overflow-hidden rounded-3xl">
                <CardContent className="pt-6 space-y-6">
                  <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">Engagement</p>

                  <div className="grid grid-cols-3 gap-4">
                    {playlistTotal > 0 && (
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            playlistYes / playlistTotal >= 0.5
                              ? "bg-lime-100 text-lime-700"
                              : "bg-neutral-100 text-neutral-500"
                          )}>
                            <ListMusic className="h-6 w-6" />
                          </div>
                        </div>
                        <p className="text-2xl font-black">
                          {Math.round((playlistYes / playlistTotal) * 100)}%
                        </p>
                        <p className="text-sm text-neutral-600">Playlist</p>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                          {playlistYes} / {playlistTotal}
                        </p>
                      </div>
                    )}

                    {shareTotal > 0 && (
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            shareYes / shareTotal >= 0.5
                              ? "bg-lime-100 text-lime-700"
                              : "bg-neutral-100 text-neutral-500"
                          )}>
                            <Share2 className="h-6 w-6" />
                          </div>
                        </div>
                        <p className="text-2xl font-black">
                          {Math.round((shareYes / shareTotal) * 100)}%
                        </p>
                        <p className="text-sm text-neutral-600">Share</p>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                          {shareYes} / {shareTotal}
                        </p>
                      </div>
                    )}

                    {followTotal > 0 && (
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            followYes / followTotal >= 0.5
                              ? "bg-lime-100 text-lime-700"
                              : "bg-neutral-100 text-neutral-500"
                          )}>
                            <UserPlus className="h-6 w-6" />
                          </div>
                        </div>
                        <p className="text-2xl font-black">
                          {Math.round((followYes / followTotal) * 100)}%
                        </p>
                        <p className="text-sm text-neutral-600">Follow</p>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                          {followYes} / {followTotal}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </AnimatedSection>
        )}

        {/* Section 5: Status (conditional - ableton, upload status, progress, snapshot) */}
        {(track.abletonRenderStatus || (track.status as any) === "UPLOADED" || track.reviewsRequested > 0 || track.status === "CANCELLED") && (
          <AnimatedSection>
            <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
              <CardContent className="pt-6 space-y-6 divide-y divide-black/10">
                {/* Ableton Rendering Status */}
                {track.abletonRenderStatus && (
                  <div className="pb-6">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">ableton project</p>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {track.abletonRenderStatus === "PENDING" && (
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600" />
                          </div>
                        )}
                        {track.abletonRenderStatus === "RENDERING" && (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          </div>
                        )}
                        {track.abletonRenderStatus === "COMPLETED" && (
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                        )}
                        {track.abletonRenderStatus === "FAILED" && (
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {track.abletonRenderStatus === "PENDING" && (
                          <>
                            <p className="font-bold text-amber-900">Rendering queued</p>
                            <p className="text-sm text-amber-700 mt-1">
                              Your project is waiting to be rendered. Individual stems will be created for reviewers to analyze.
                            </p>
                          </>
                        )}
                        {track.abletonRenderStatus === "RENDERING" && (
                          <>
                            <p className="font-bold text-blue-900">Rendering in progress</p>
                            <p className="text-sm text-blue-700 mt-1">
                              Creating individual stems from your project tracks. This usually takes a few minutes.
                            </p>
                          </>
                        )}
                        {track.abletonRenderStatus === "COMPLETED" && (
                          <>
                            <p className="font-bold text-emerald-900">Rendering complete</p>
                            <p className="text-sm text-emerald-700 mt-1">
                              Stems created successfully! Reviewers can now analyze individual tracks and provide detailed feedback.
                            </p>
                          </>
                        )}
                        {track.abletonRenderStatus === "FAILED" && (
                          <>
                            <p className="font-bold text-red-900">Rendering failed</p>
                            <p className="text-sm text-red-700 mt-1">
                              There was an issue rendering your project. Please contact support for assistance.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Status */}
                {(track.status as any) === "UPLOADED" && (
                  <div className="pt-6">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">next</p>
                    <p className="text-xl font-light tracking-tight">Ready when you are.</p>
                    <p className="mt-2 text-sm text-black/50">
                      This track is uploaded and private to your library. Request reviews whenever you want listener feedback.
                    </p>
                    <div className="mt-5">
                      <Link href={`/artist/tracks/${track.id}/request-reviews`}>
                        <Button variant="airyPrimary" className="w-full h-11">
                          Request reviews
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Cancelled Status */}
                {track.status === "CANCELLED" && (
                  <div className="pt-6">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">status</p>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">This track was cancelled</p>
                        <p className="text-sm text-neutral-600">
                          {track.payment?.status === "REFUNDED"
                            ? "Your payment has been refunded."
                            : track.payment?.status === "COMPLETED"
                            ? "Refund is processing or pending."
                            : "No payment was captured."}
                        </p>
                      </div>
                      <div className="text-sm text-neutral-500 font-mono">CANCELLED</div>
                    </div>
                  </div>
                )}

                {/* Review Progress */}
                

                {/* Snapshot Stats */}
                
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
