import { Card, CardContent } from "@/components/ui/card";
import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import { ListMusic, Share2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  Review: Review[];
  platformAverages: {
    production: number;
    originality: number;
    vocals: number;
  };
  isFreeTier?: boolean;
}

export function StatsTab({ reviews, platformAverages, isFreeTier = false }: StatsTabProps) {
  const analyticsReviews = reviews.filter(r => r.countsTowardAnalytics !== false);

  // Calculate engagement signals
  const playlistYes = analyticsReviews.filter((r) => r.wouldAddToPlaylist === true).length;
  const playlistTotal = analyticsReviews.filter((r) => r.wouldAddToPlaylist !== null).length;
  const shareYes = analyticsReviews.filter((r) => r.wouldShare === true).length;
  const shareTotal = analyticsReviews.filter((r) => r.wouldShare !== null).length;
  const followYes = analyticsReviews.filter((r) => r.wouldFollow === true).length;
  const followTotal = analyticsReviews.filter((r) => r.wouldFollow !== null).length;
  const hasListenerSignals = playlistTotal > 0 || shareTotal > 0 || followTotal > 0;

  return (
    <div className="space-y-6">
      {/* Analytics */}
      <AggregateAnalytics
        reviews={analyticsReviews}
        platformAverages={platformAverages}
      />

      {/* Engagement Signals */}
      {hasListenerSignals && !isFreeTier && (
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
                        ? "bg-purple-100 text-purple-700"
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
                        ? "bg-purple-100 text-purple-700"
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
                        ? "bg-purple-100 text-purple-700"
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
      )}
    </div>
  );
}
