import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Headphones, Sparkles, Coins, ListMusic, Star } from "lucide-react";
import { ClaimCard } from "@/components/dashboard/claim-card";
import { MobileStickyCTA } from "@/components/dashboard/mobile-sticky-cta";
import { DashboardWinner } from "@/components/charts/dashboard-winner";
import { DashboardQueue } from "@/components/dashboard/dashboard-queue";
import { DashboardArtistProfile, MinimalArtistProfile } from "@/types/dashboard";
import { getWhatsNextGuidance } from "@/lib/dashboard-helpers";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";
import { safeArtwork } from "@/lib/artwork";

export const dynamic = "force-dynamic";

export default async function DashboardV2Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  let artistProfile: DashboardArtistProfile | MinimalArtistProfile | null = null;
  try {
    artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        reviewCredits: true,
        totalPeerReviews: true,
        peerReviewRating: true,
        peerGemCount: true,
        hasSeenCreditGuide: true,
        subscriptionStatus: true,
        Genre_ArtistReviewGenres: true,
        Track: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            sourceUrl: true,
            status: true,
            reviewsRequested: true,
            reviewsCompleted: true,
            feedbackViewedAt: true,
            Genre: true,
            Review: {
              select: {
                status: true,
                createdAt: true,
                productionScore: true,
                vocalScore: true,
                originalityScore: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    artistProfile = null;
  }

  if (!artistProfile) redirect("/onboarding");

  const credits: number = "reviewCredits" in artistProfile ? artistProfile.reviewCredits ?? 0 : 0;
  const tracks = artistProfile.Track ?? [];
  const isPro = artistProfile.subscriptionStatus === "active";
  const maxSlots = getMaxSlots(isPro);
  const totalReviewsReceived = tracks.reduce((sum, t) => sum + (t.reviewsCompleted ?? 0), 0);
  const peerRating = "peerReviewRating" in artistProfile ? artistProfile.peerReviewRating ?? null : null;
  const totalPeerReviews = "totalPeerReviews" in artistProfile ? artistProfile.totalPeerReviews ?? 0 : 0;

  const activeTracks = tracks.filter((t) =>
    (ACTIVE_TRACK_STATUSES as readonly string[]).includes(t.status)
  );

  const tracksWithFeedback = tracks.filter((t) => {
    const completedReviews = t.Review.filter((r) => r.status === "COMPLETED");
    if (completedReviews.length === 0) return false;
    if (!t.feedbackViewedAt) return true;
    const viewedAt = new Date(t.feedbackViewedAt).getTime();
    return completedReviews.some((r) => new Date(r.createdAt).getTime() > viewedAt);
  });

  const [reviewedTrackIdSet, availableTracksRaw] = await Promise.all([
    prisma.review
      .findMany({ where: { peerReviewerArtistId: artistProfile.id }, select: { trackId: true } })
      .then((r: { trackId: string }[]) => new Set(r.map((x) => x.trackId)))
      .catch(() => new Set<string>()),
    prisma.track.findMany({
      where: {
        packageType: "PEER",
        status: { in: ["QUEUED", "IN_PROGRESS"] },
        artistId: { not: artistProfile.id },
        abTestPrimaryTrackId: null,
      },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        createdAt: true,
        reviewsRequested: true,
        Genre: true,
        ArtistProfile: {
          select: { artistName: true, subscriptionStatus: true, User: { select: { email: true } } },
        },
        _count: {
          select: { Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const availableQueueTracks = availableTracksRaw
    .filter((t) => !reviewedTrackIdSet.has(t.id) && t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      const aIsPro = a.ArtistProfile?.subscriptionStatus === "active";
      const bIsPro = b.ArtistProfile?.subscriptionStatus === "active";
      if (aIsPro !== bIsPro) return aIsPro ? -1 : 1;
      const aIsSeed = a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed = b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0;
    })
    .slice(0, 4);

  const whatsNext = getWhatsNextGuidance({
    tracks,
    reviewCredits: credits,
    subscriptionStatus: artistProfile.subscriptionStatus,
    pendingPeerReviews: availableQueueTracks.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      Track: { title: t.title, artworkUrl: t.artworkUrl, Genre: t.Genre, ArtistProfile: t.ArtistProfile },
    })),
    totalPeerReviews: "totalPeerReviews" in artistProfile ? artistProfile.totalPeerReviews : undefined,
  });

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Greeting + key stats row ─────────────────────────── */}
        <header className="pt-10 pb-6 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-black/40">Welcome back</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black leading-none mt-1 truncate">
              {artistProfile.artistName}
            </h1>
          </div>
          <div className="flex items-stretch gap-3">
            <StatPill icon={Coins} value={credits} label={isPro ? "credits" : "to spend"} accent />
            <StatPill icon={ListMusic} value={`${activeTracks.length}/${maxSlots}`} label="in queue" />
            {totalPeerReviews > 0 && peerRating ? (
              <StatPill icon={Star} value={peerRating.toFixed(1)} label="your rating" />
            ) : (
              <StatPill icon={MessageCircle} value={totalReviewsReceived} label="reviews in" />
            )}
          </div>
        </header>

        <main className="space-y-5">
          {/* ── Feedback ready — single calm notification ───────── */}
          {tracksWithFeedback.length > 0 && (
            <Link
              href={`/tracks/${tracksWithFeedback[0].id}`}
              className="group flex items-center gap-4 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 transition-colors hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/15"
            >
              <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                  New feedback is ready
                </p>
                <p className="text-xs text-purple-700/70 dark:text-purple-200/60 truncate">
                  {tracksWithFeedback.length > 1
                    ? `${tracksWithFeedback.length} tracks have new reviews`
                    : `"${tracksWithFeedback[0].title}" — see what they said`}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* ── Primary: your next move — one soft hero card ────── */}
          {whatsNext && (
            <section className="rounded-3xl border border-black/8 bg-white shadow-sm overflow-hidden">
              <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-500/15 px-2.5 py-1 mb-3">
                    <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-600 dark:text-purple-300">
                      Your next move
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight">
                    {whatsNext.title}
                  </h2>
                  <p className="text-sm text-black/50 mt-1.5 leading-relaxed max-w-md">
                    {whatsNext.description}
                  </p>
                </div>
                <Link href={whatsNext.action.href} className="flex-shrink-0">
                  <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-11 px-6 text-sm shadow-sm">
                    {whatsNext.action.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </section>
          )}

          {/* ── Your queue ──────────────────────────────────────── */}
          <section className="rounded-3xl border border-black/8 bg-white shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-black tracking-tight">Your queue</h2>
                <p className="text-xs text-black/40 mt-0.5">
                  {activeTracks.length === 0
                    ? "No tracks in review right now"
                    : `${activeTracks.length} of ${maxSlots} slot${maxSlots === 1 ? "" : "s"} active`}
                </p>
              </div>
              <Link
                href="/tracks"
                className="text-xs font-bold text-black/40 hover:text-black transition-colors"
              >
                Manage →
              </Link>
            </div>
            <DashboardQueue
              activeTracks={activeTracks.map((t) => ({
                id: t.id,
                title: t.title,
                artworkUrl: safeArtwork(t.artworkUrl),
                status: t.status,
                reviewsRequested: t.reviewsRequested ?? 0,
                reviewsCompleted: (t.Review ?? []).filter((r) => r.status === "COMPLETED").length,
              }))}
              eligibleTracks={tracks
                .filter((t) => !(ACTIVE_TRACK_STATUSES as readonly string[]).includes(t.status))
                .map((t) => ({
                  id: t.id,
                  title: t.title,
                  artworkUrl: safeArtwork(t.artworkUrl),
                  status: t.status,
                  genreName: (t as any).Genre?.[0]?.name ?? null,
                  reviewsCompleted: (t.Review ?? []).filter((r: any) => r.status === "COMPLETED").length,
                  reviewsRequested: t.reviewsRequested ?? 0,
                }))}
              maxSlots={maxSlots}
              isPro={isPro}
              credits={credits}
            />
          </section>

          {/* ── Review & earn ───────────────────────────────────── */}
          <section className="rounded-3xl border border-black/8 bg-white shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-black tracking-tight">Review &amp; earn</h2>
                <p className="text-xs text-black/40 mt-0.5">
                  {availableQueueTracks.length > 0
                    ? "Leave feedback, get +1 credit"
                    : "Nothing in the queue right now"}
                </p>
              </div>
              <Link
                href="/review"
                className="text-xs font-bold text-black/40 hover:text-black transition-colors"
              >
                View all →
              </Link>
            </div>

            {availableQueueTracks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableQueueTracks.map((track) => (
                  <ClaimCard
                    key={track.id}
                    trackId={track.id}
                    title={track.title}
                    artistName={track.ArtistProfile.artistName}
                    artworkUrl={safeArtwork(track.artworkUrl)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-black/8 bg-black/[0.02] py-10 text-center">
                <Headphones className="h-9 w-9 text-black/20 mx-auto mb-2.5" />
                <p className="text-sm font-bold text-black/40">No tracks to review right now</p>
                <p className="text-xs text-black/30 mt-0.5">The queue refreshes often — check back soon</p>
              </div>
            )}
          </section>

          {/* ── Track of the day ────────────────────────────────── */}
          <DashboardWinner compact />
        </main>
      </div>

      <MobileStickyCTA show={tracks.length === 0 || credits > 0} />
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border px-4 py-2.5 min-w-[88px] " +
        (accent
          ? "border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10"
          : "border-black/8 bg-white shadow-sm")
      }
    >
      <div className="flex items-center gap-1.5">
        <Icon className={"h-3.5 w-3.5 " + (accent ? "text-purple-600 dark:text-purple-300" : "text-black/30")} />
        <span className={"text-xl font-black tabular-nums leading-none " + (accent ? "text-purple-700 dark:text-purple-200" : "text-black")}>
          {value}
        </span>
      </div>
      <p className={"text-[10px] font-bold uppercase tracking-wider mt-1 " + (accent ? "text-purple-500/70 dark:text-purple-300/60" : "text-black/35")}>
        {label}
      </p>
    </div>
  );
}
