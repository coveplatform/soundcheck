import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import { ListMusic, Share2, UserPlus, Repeat2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Review {
  productionScore: number | null;
  originalityScore: number | null;
  vocalScore: number | null;
  wouldListenAgain: boolean | null;
  wouldAddToPlaylist: boolean | null;
  wouldShare: boolean | null;
  wouldFollow: boolean | null;
  perceivedGenre: string | null;
  similarArtists: string | null;
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST" | null;
  countsTowardAnalytics: boolean;
}

interface StatsTabProps {
  reviews: Review[];
  platformAverages: {
    production: number;
    originality: number;
    vocals: number;
  };
  isFreeTier?: boolean;
}

function IntentStat({
  icon,
  label,
  yes,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  yes: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.round((yes / total) * 100);
  const isPositive = pct >= 50;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl p-4 border-2 transition-all",
      isPositive
        ? "border-purple-200 bg-gradient-to-b from-purple-50 to-white"
        : "border-neutral-200 bg-white"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center mb-2",
        isPositive ? "bg-purple-100 text-purple-600" : "bg-neutral-100 text-neutral-400"
      )}>
        {icon}
      </div>
      <p className={cn(
        "text-3xl font-black tabular-nums leading-none mb-1",
        isPositive ? "text-purple-600" : "text-neutral-500"
      )}>
        {pct}%
      </p>
      <p className="text-xs font-semibold text-neutral-600">{label}</p>
      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{yes}/{total} listeners</p>
    </div>
  );
}

const MIN_REVIEWS_FOR_FULL_SIGNAL = 5;

export function StatsTab({ reviews, platformAverages }: StatsTabProps) {
  const analyticsReviews = reviews.filter(r => r.countsTowardAnalytics !== false);
  const reviewCount = analyticsReviews.length;

  // Listener intent signals
  const playlistYes = analyticsReviews.filter((r) => r.wouldAddToPlaylist === true).length;
  const playlistTotal = analyticsReviews.filter((r) => r.wouldAddToPlaylist !== null).length;
  const shareYes = analyticsReviews.filter((r) => r.wouldShare === true).length;
  const shareTotal = analyticsReviews.filter((r) => r.wouldShare !== null).length;
  const followYes = analyticsReviews.filter((r) => r.wouldFollow === true).length;
  const followTotal = analyticsReviews.filter((r) => r.wouldFollow !== null).length;
  const listenAgainYes = analyticsReviews.filter((r) => r.wouldListenAgain === true).length;
  const listenAgainTotal = analyticsReviews.filter((r) => r.wouldListenAgain !== null).length;

  const hasAnySignal = playlistTotal > 0 || shareTotal > 0 || followTotal > 0 || listenAgainTotal > 0;
  const needsMoreReviews = reviewCount < MIN_REVIEWS_FOR_FULL_SIGNAL;

  return (
    <div className="space-y-6">

      {/* ── LISTENER INTENT — headline section ── */}
      {hasAnySignal && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">Listener Intent</p>
              <h3 className="text-lg font-bold text-black mt-0.5">Would they act on this track?</h3>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-neutral-400 font-mono">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <IntentStat
              icon={<ListMusic className="h-5 w-5" />}
              label="Add to playlist"
              yes={playlistYes}
              total={playlistTotal}
            />
            <IntentStat
              icon={<Share2 className="h-5 w-5" />}
              label="Share it"
              yes={shareYes}
              total={shareTotal}
            />
            <IntentStat
              icon={<UserPlus className="h-5 w-5" />}
              label="Follow artist"
              yes={followYes}
              total={followTotal}
            />
            <IntentStat
              icon={<Repeat2 className="h-5 w-5" />}
              label="Listen again"
              yes={listenAgainYes}
              total={listenAgainTotal}
            />
          </div>

          {/* Confidence nudge — more reviews = more reliable signal */}
          {needsMoreReviews && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <span className="font-bold">{MIN_REVIEWS_FOR_FULL_SIGNAL - reviewCount} more {MIN_REVIEWS_FOR_FULL_SIGNAL - reviewCount === 1 ? "review" : "reviews"}</span> will give you a reliable signal
                </p>
              </div>
              <Link
                href="/review"
                className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-purple-600 transition-colors whitespace-nowrap ml-3"
              >
                Review to earn <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── SCORE ANALYTICS — supporting data ── */}
      <div className="space-y-2">
        {hasAnySignal && (
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">Score Breakdown</p>
        )}
        <AggregateAnalytics
          reviews={analyticsReviews}
          platformAverages={platformAverages}
        />
      </div>

    </div>
  );
}
