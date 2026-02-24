"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Music,
  ChevronUp,
  Play,
  RefreshCw,
  Trophy,
  BarChart3,
} from "lucide-react";
import { ChartEntry } from "@/components/charts/chart-entry";
import { FeaturedWinner } from "@/components/charts/featured-winner";
import { SubmitToChart } from "@/components/charts/submit-to-chart";
import { YourActivity } from "@/components/charts/your-activity";
import { ChartAnalytics } from "@/components/charts/chart-analytics";
import { SparklesDoodle, StarDoodle, DotsDoodle } from "@/components/dashboard/doodles";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  rank: number;
  trackId: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  genre: string | null;
  genres?: string[];
  voteCount: number;
  playCount: number;
  artistName: string;
  artistImage: string | null;
  isPro: boolean;
  hasVoted: boolean;
  isOwn: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface FeaturedWinnerData {
  id: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  voteCount: number;
  artistName: string;
  artistImage: string | null;
}

interface ChartData {
  date: string;
  period: string;
  leaderboard: LeaderboardEntry[];
  featuredWinner: FeaturedWinnerData | null;
  totalSubmissions: number;
}

interface TodaySubmission {
  id: string;
  title: string;
  artworkUrl: string | null;
  voteCount: number;
  playCount: number;
  rank: number | null;
  date: string;
}

interface ActivityData {
  isPro: boolean;
  maxSlots: number;
  slotsUsed: number;
  canSubmit: boolean;
  todaySubmissions: TodaySubmission[];
  stats: {
    totalSubmissions: number;
    totalVotesReceived: number;
    wins: number;
    bestRank: number | null;
  };
}

export default function ChartsPage() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDate, setChartDate] = useState(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [analyticsSubmissionId, setAnalyticsSubmissionId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);

  const fetchChart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStr = chartDate.toISOString().split("T")[0];
      const res = await fetch(`/api/charts?date=${dateStr}&period=daily`);
      if (!res.ok) throw new Error("Failed to fetch chart");
      const data = await res.json();
      setChartData(data);
    } catch {
      setError("Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  }, [chartDate]);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/charts/activity");
      if (!res.ok) return;
      const data = await res.json();
      if (data.activity) setActivity(data.activity);
    } catch {}
  }, []);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleVote = async (submissionId: string, listenDuration: number): Promise<{ creditEarned: boolean }> => {
    const res = await fetch("/api/charts/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, listenDuration }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Vote failed");
    }
    return { creditEarned: !!data.creditEarned };
  };

  const handleUnvote = async (submissionId: string) => {
    const res = await fetch("/api/charts/vote", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Unvote failed");
    }
  };

  const handlePlay = async (submissionId: string) => {
    fetch("/api/charts/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    }).catch(() => {});
  };

  const handleSubmitted = () => {
    fetchChart();
    fetchActivity();
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(chartDate);
    if (direction === "prev") {
      newDate.setUTCDate(newDate.getUTCDate() - 1);
    } else {
      newDate.setUTCDate(newDate.getUTCDate() + 1);
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (newDate > today) return;
    setChartDate(newDate);
  };

  const isToday = (() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return chartDate.getTime() === today.getTime();
  })();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00Z");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    if (d.getTime() === today.getTime()) return "Today";
    if (d.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const todaySubmissions = activity?.todaySubmissions ?? [];
  const hasEntries = todaySubmissions.length > 0;
  const canSubmitMore = activity ? activity.canSubmit : false;
  const isPro = activity?.isPro ?? false;
  const maxSlots = activity?.maxSlots ?? 1;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black relative overflow-hidden">
        <SparklesDoodle className="absolute -bottom-4 left-[40%] w-20 h-20 text-purple-400/20 pointer-events-none" />
        <StarDoodle className="absolute top-2 right-[30%] w-10 h-10 text-purple-400/15 pointer-events-none" />
        <DotsDoodle className="absolute -top-2 left-[15%] w-16 h-16 text-black/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30">Live now</span>
                </span>
                <span className="text-black/15">·</span>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30">Every genre</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Track of{" "}
                <span className="text-purple-600">the Day.</span>
              </h1>
              <p className="text-sm text-black/40 mt-3 max-w-sm leading-relaxed">
                Submit. Get voted on. #1 wins 24hrs of visibility — hip-hop, ambient, metal, everything competes together.
              </p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              {isToday && (
                <>
                  <p className="text-3xl sm:text-4xl font-black text-black leading-none tabular-nums font-mono">
                    {getTimeUntilReset()}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mt-1.5">
                    until reset
                  </p>
                </>
              )}
              {!isToday && chartData && (
                <>
                  <p className="text-3xl sm:text-4xl font-black text-black leading-none tabular-nums">
                    {chartData.totalSubmissions}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mt-1.5">
                    tracks
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURED WINNER ──────────────────────────────────── */}
      {chartData?.featuredWinner && isToday && (
        <FeaturedWinner
          submissionId={chartData.featuredWinner.id}
          title={chartData.featuredWinner.title}
          artistName={chartData.featuredWinner.artistName}
          artworkUrl={chartData.featuredWinner.artworkUrl}
          sourceUrl={chartData.featuredWinner.sourceUrl}
          voteCount={chartData.featuredWinner.voteCount}
          artistImage={chartData.featuredWinner.artistImage}
        />
      )}

      {/* ── YOUR ENTRY ───────────────────────────────────────── */}
      {isToday && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">
              Your Entry
            </p>
            {isPro && (
              <span className="text-[10px] font-black uppercase tracking-wider text-black/25">
                {todaySubmissions.length}/{maxSlots} slots
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Active submissions */}
            {todaySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Artwork */}
                  <div className="flex-shrink-0 relative w-14 h-14 rounded-xl overflow-hidden border-2 border-black/8">
                    {sub.artworkUrl ? (
                      <Image src={sub.artworkUrl} alt={sub.title} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <Music className="w-5 h-5 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-black truncate">{sub.title}</p>
                    <p className="text-[11px] text-black/40 font-medium mt-0.5">Live in today&apos;s chart</p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isPro && (
                      <button
                        onClick={() => setAnalyticsSubmissionId(sub.id)}
                        className="p-2 rounded-lg hover:bg-purple-50 transition-colors"
                        title="View analytics"
                      >
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black/10 hover:border-black/25 bg-white text-[11px] font-black text-black/50 hover:text-black transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Replace
                    </button>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="border-t-2 border-black/5 grid grid-cols-3 divide-x-2 divide-black/5">
                  <div className="px-4 py-3 text-center">
                    <p className={cn(
                      "text-2xl font-black tabular-nums leading-none",
                      sub.rank === 1 ? "text-amber-500" : sub.rank && sub.rank <= 3 ? "text-black" : "text-black/40"
                    )}>
                      {sub.rank ? `#${sub.rank}` : "—"}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-black/25 mt-1">Rank</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ChevronUp className="w-3.5 h-3.5 text-purple-500" />
                      <p className="text-2xl font-black tabular-nums leading-none text-black">{sub.voteCount}</p>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-black/25 mt-1">Votes</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Play className="w-3 h-3 text-black/30" />
                      <p className="text-2xl font-black tabular-nums leading-none text-black">{sub.playCount}</p>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-black/25 mt-1">Plays</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Add slot (Pro with open slots, or empty state for everyone) */}
            {canSubmitMore && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl border-2 p-4 transition-all group",
                  hasEntries
                    ? "border-dashed border-black/15 hover:border-purple-400 hover:bg-purple-50/50"
                    : "border-black bg-purple-600 hover:bg-purple-700 shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl border-2 flex items-center justify-center flex-shrink-0",
                  hasEntries
                    ? "border-dashed border-black/15 group-hover:border-purple-400"
                    : "border-white/20 bg-white/15"
                )}>
                  <Plus className={cn("w-5 h-5", hasEntries ? "text-black/25 group-hover:text-purple-500" : "text-white")} />
                </div>
                <div className="flex-1 text-left">
                  <p className={cn(
                    "text-sm font-black",
                    hasEntries ? "text-black/40 group-hover:text-purple-600" : "text-white"
                  )}>
                    {hasEntries ? "Add another track" : "Submit your track"}
                  </p>
                  <p className={cn(
                    "text-[11px] font-medium mt-0.5",
                    hasEntries ? "text-black/25" : "text-white/60"
                  )}>
                    {hasEntries
                      ? `${maxSlots - todaySubmissions.length} slot${maxSlots - todaySubmissions.length !== 1 ? "s" : ""} remaining`
                      : "Enter today's competition — free"
                    }
                  </p>
                </div>
                {!hasEntries && (
                  <span className="text-[11px] font-black text-white/60 border border-white/20 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                    Enter now
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CONTROLS ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4 mt-4 border-b border-black/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25">
            {isLoading ? "Loading..." : chartData ? `${chartData.totalSubmissions} track${chartData.totalSubmissions !== 1 ? "s" : ""}` : "Today's Chart"}
          </p>
          {/* Date nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate("prev")}
              className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-black/30" />
            </button>
            <span className="text-[11px] font-bold text-black/50 px-1.5 min-w-[60px] text-center">
              {chartData ? formatDate(chartData.date) : "..."}
            </span>
            <button
              onClick={() => navigateDate("next")}
              disabled={isToday}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isToday ? "text-black/10 cursor-not-allowed" : "hover:bg-neutral-100 text-black/30"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── LEADERBOARD ─────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-black/20 animate-spin" />
            <p className="text-[11px] font-black uppercase tracking-wider text-black/20">Loading chart...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-red-300" />
            </div>
            <p className="text-sm font-black text-black/60">{error}</p>
            <button
              onClick={fetchChart}
              className="mt-3 text-[11px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-800 transition-colors"
            >
              Try again →
            </button>
          </div>
        ) : chartData && chartData.leaderboard.length > 0 ? (
          <div className="mt-5">
            {/* Credit incentive callout */}
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-lime-50 border border-lime-200">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-lime-400 flex items-center justify-center text-sm font-black text-lime-900">
                +1
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-lime-900 leading-tight">
                  Vote = earn a credit. Up to 5 per day.
                </p>
                <p className="text-[11px] text-lime-700/70 leading-tight mt-0.5">
                  Credits buy you peer reviews for your own music.
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-wider text-lime-600/60">
                Listen 30s first
              </span>
            </div>
            <div className="bg-white rounded-2xl border-2 border-black/8 px-4 sm:px-5 overflow-hidden">
              {chartData.leaderboard.map((entry, i) => (
                <ChartEntry
                  key={entry.id}
                  {...entry}
                  rank={i + 1}
                  onVote={handleVote}
                  onUnvote={handleUnvote}
                  onPlay={handlePlay}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black text-black tracking-tight">
              {isToday ? "No tracks yet" : "No tracks this day"}
            </h3>
            <p className="text-[13px] text-black/40 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
              {isToday
                ? "Be the first to drop your track and claim the top spot."
                : "Check today's chart for the latest submissions."}
            </p>
            {isToday && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 text-white rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit your track
              </button>
            )}
          </div>
        )}

        {/* Stats line */}
        {chartData && chartData.leaderboard.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-5 pb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-black/25">
              {chartData.totalSubmissions} track{chartData.totalSubmissions !== 1 ? "s" : ""}
            </span>
            <span className="w-1 h-1 rounded-full bg-black/15" />
            <span className="text-[11px] font-black uppercase tracking-wider text-black/25">
              {chartData.leaderboard.reduce((sum, e) => sum + e.voteCount, 0)} votes
            </span>
          </div>
        )}

        {/* ── YOUR ACTIVITY (past results) ─────────────────────── */}
        <div className="mt-8">
          <YourActivity
            onViewAnalytics={(id) => setAnalyticsSubmissionId(id)}
          />
        </div>
      </div>

      {/* Submit Modal */}
      <SubmitToChart
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmitted={handleSubmitted}
      />

      {/* Analytics Modal (Pro) */}
      <ChartAnalytics
        submissionId={analyticsSubmissionId}
        onClose={() => setAnalyticsSubmissionId(null)}
      />
    </div>
  );
}
