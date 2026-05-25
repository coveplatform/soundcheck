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
  BarChart3,
} from "lucide-react";
import { ChartEntry } from "@/components/charts/chart-entry";
import { FeaturedWinner } from "@/components/charts/featured-winner";
import { SubmitToChart } from "@/components/charts/submit-to-chart";
import { YourActivity } from "@/components/charts/your-activity";
import { ChartAnalytics } from "@/components/charts/chart-analytics";
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

  useEffect(() => { fetchChart(); }, [fetchChart]);
  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const handleVote = async (submissionId: string, listenDuration: number): Promise<{ creditEarned: boolean }> => {
    const res = await fetch("/api/charts/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, listenDuration }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Vote failed");
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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#f9f7ff" }}>

      {/* ══ SECTION 1 — HERO ══ deep indigo ══════════════════════════ */}
      <div style={{ backgroundColor: "#2d1b69" }}>

        {/* ── Placeholder image ── swap this div for <Image> when ready ── */}
        <div
          className="w-full relative flex items-center justify-center"
          style={{
            aspectRatio: "21 / 9",
            minHeight: "240px",
            maxHeight: "500px",
            backgroundColor: "#1a0f3d",
          }}
        >
          <Image src="/charts-hero.jpg" alt="Track of the Day" fill className="object-cover" />
        </div>

        {/* ── Title + countdown ── */}
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10 sm:py-12">
          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#a3e635" }} />
                <span
                  className="font-black uppercase"
                  style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(196,179,247,0.45)" }}
                >
                  Live now · Every genre
                </span>
              </div>
              <h1
                className="font-black leading-none"
                style={{
                  fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
                  letterSpacing: "-0.03em",
                  color: "#fff",
                  lineHeight: 0.95,
                }}
              >
                Track of<br />
                <span style={{ color: "#c4b3f7" }}>the Day.</span>
              </h1>
            </div>

            <div className="text-right" style={{ paddingBottom: "4px" }}>
              {isToday && (
                <>
                  <p
                    className="font-black tabular-nums font-mono leading-none"
                    style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#fff" }}
                  >
                    {getTimeUntilReset()}
                  </p>
                  <p
                    className="font-black uppercase mt-2"
                    style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(196,179,247,0.4)" }}
                  >
                    until reset
                  </p>
                </>
              )}
              {!isToday && chartData && (
                <>
                  <p
                    className="font-black tabular-nums leading-none"
                    style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#fff" }}
                  >
                    {chartData.totalSubmissions}
                  </p>
                  <p
                    className="font-black uppercase mt-2"
                    style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(196,179,247,0.4)" }}
                  >
                    tracks
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SECTION 2 — FEATURED WINNER ══ soft lavender ══════════════ */}
      {chartData?.featuredWinner && isToday && (
        <div style={{ backgroundColor: "#e8deff" }}>
          <FeaturedWinner
            submissionId={chartData.featuredWinner.id}
            title={chartData.featuredWinner.title}
            artistName={chartData.featuredWinner.artistName}
            artworkUrl={chartData.featuredWinner.artworkUrl}
            sourceUrl={chartData.featuredWinner.sourceUrl}
            voteCount={chartData.featuredWinner.voteCount}
            artistImage={chartData.featuredWinner.artistImage}
          />
        </div>
      )}

      {/* ══ SECTION 3 — YOUR ENTRY ══ light lavender ══════════════════ */}
      {isToday && (
        <div style={{ backgroundColor: "#f3eeff" }} className="py-10">
          <div className="max-w-3xl mx-auto px-6 sm:px-10">
            <div className="flex items-center justify-between mb-6">
              <p
                className="font-black uppercase"
                style={{ fontSize: "10px", letterSpacing: "0.35em", color: "#7c5cbf" }}
              >
                Your Entry
              </p>
              {isPro && (
                <span
                  className="font-black uppercase"
                  style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#a78bfa" }}
                >
                  {todaySubmissions.length}/{maxSlots} slots
                </span>
              )}
            </div>

            <div className="space-y-3">
              {todaySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="overflow-hidden"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "16px",
                    border: "1px solid #d4c3ff",
                  }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className="flex-shrink-0 relative overflow-hidden"
                      style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: "#ede8ff" }}
                    >
                      {sub.artworkUrl ? (
                        <Image src={sub.artworkUrl} alt={sub.title} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music style={{ width: 20, height: 20, color: "#c4b3f7" }} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: "#2d1b69" }}>{sub.title}</p>
                      <p className="font-medium mt-0.5" style={{ fontSize: "11px", color: "#9d7fd4" }}>
                        Live in today&apos;s chart
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {isPro && (
                        <button
                          onClick={() => setAnalyticsSubmissionId(sub.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: "#f3eeff" }}
                          title="View analytics"
                        >
                          <BarChart3 style={{ width: 16, height: 16, color: "#8b5cf6" }} />
                        </button>
                      )}
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all"
                        style={{
                          fontSize: "11px",
                          backgroundColor: "#ede8ff",
                          color: "#7c5cbf",
                          border: "1px solid #d4c3ff",
                        }}
                      >
                        <RefreshCw style={{ width: 12, height: 12 }} />
                        Replace
                      </button>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-3"
                    style={{ borderTop: "1px solid #ede8ff" }}
                  >
                    {[
                      {
                        value: sub.rank ? `#${sub.rank}` : "—",
                        label: "Rank",
                        color: sub.rank === 1 ? "#f59e0b" : sub.rank && sub.rank <= 3 ? "#2d1b69" : "#b8a0e0",
                      },
                      { value: sub.voteCount, label: "Votes", color: "#8b5cf6" },
                      { value: sub.playCount, label: "Plays", color: "#2d1b69" },
                    ].map(({ value, label, color }, i) => (
                      <div
                        key={label}
                        className="px-4 py-3 text-center"
                        style={i > 0 ? { borderLeft: "1px solid #ede8ff" } : {}}
                      >
                        <p className="text-2xl font-black tabular-nums leading-none" style={{ color }}>
                          {value}
                        </p>
                        <p
                          className="font-black uppercase mt-1"
                          style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#b8a0e0" }}
                        >
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {canSubmitMore && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full flex items-center gap-4 p-5 transition-all group"
                  style={{
                    borderRadius: 16,
                    backgroundColor: hasEntries ? "transparent" : "#2d1b69",
                    border: hasEntries ? "2px dashed #d4c3ff" : "none",
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      backgroundColor: hasEntries ? "#ede8ff" : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Plus
                      style={{
                        width: 20,
                        height: 20,
                        color: hasEntries ? "#a78bfa" : "#fff",
                      }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className="text-sm font-black"
                      style={{ color: hasEntries ? "#7c5cbf" : "#fff" }}
                    >
                      {hasEntries ? "Add another track" : "Submit your track"}
                    </p>
                    <p
                      className="font-medium mt-0.5"
                      style={{ fontSize: "11px", color: hasEntries ? "#b8a0e0" : "rgba(255,255,255,0.5)" }}
                    >
                      {hasEntries
                        ? `${maxSlots - todaySubmissions.length} slot${maxSlots - todaySubmissions.length !== 1 ? "s" : ""} remaining`
                        : "Enter today's competition — free"}
                    </p>
                  </div>
                  {!hasEntries && (
                    <span
                      className="flex-shrink-0 font-black uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.2em",
                        color: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 999,
                        padding: "4px 12px",
                      }}
                    >
                      Enter now
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ SECTION 4 — LEADERBOARD ══ near-white + lavender stripe ══ */}
      <div style={{ backgroundColor: "#f9f7ff" }}>

        {/* Date nav — full-width lavender stripe */}
        <div style={{ backgroundColor: "#ede8ff", borderBottom: "1px solid #d4c3ff" }}>
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-3 flex items-center justify-between">
            <p
              className="font-black uppercase"
              style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#9d7fd4" }}
            >
              {isLoading
                ? "Loading..."
                : chartData
                  ? `${chartData.totalSubmissions} track${chartData.totalSubmissions !== 1 ? "s" : ""}`
                  : "Today's Chart"}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate("prev")}
                className="p-1.5 rounded-md transition-colors hover:bg-white/60"
              >
                <ChevronLeft style={{ width: 16, height: 16, color: "#9d7fd4" }} />
              </button>
              <span
                className="font-bold px-2 text-center"
                style={{ fontSize: "11px", color: "#7c5cbf", minWidth: 64 }}
              >
                {chartData ? formatDate(chartData.date) : "..."}
              </span>
              <button
                onClick={() => navigateDate("next")}
                disabled={isToday}
                className="p-1.5 rounded-md transition-colors"
                style={isToday ? { opacity: 0.3, cursor: "not-allowed" } : { cursor: "pointer" }}
              >
                <ChevronRight
                  style={{ width: 16, height: 16, color: isToday ? "#c4b3f7" : "#9d7fd4" }}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 style={{ width: 24, height: 24, color: "#c4b3f7", animation: "spin 1s linear infinite" }} className="animate-spin" />
              <p
                className="font-black uppercase"
                style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#c4b3f7" }}
              >
                Loading chart...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div
                className="flex items-center justify-center mx-auto mb-4"
                style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#ede8ff" }}
              >
                <Music style={{ width: 24, height: 24, color: "#c4b3f7" }} />
              </div>
              <p className="text-sm font-black" style={{ color: "#7c5cbf" }}>{error}</p>
              <button
                onClick={fetchChart}
                className="mt-3 font-black uppercase transition-colors"
                style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#8b5cf6" }}
              >
                Try again →
              </button>
            </div>
          ) : chartData && chartData.leaderboard.length > 0 ? (
            <>
              {/* Vote-to-earn callout */}
              <div
                className="flex items-center gap-3 mb-6 px-4 py-3"
                style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: 12,
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center text-sm font-black"
                  style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "#4ade80", color: "#14532d" }}
                >
                  +1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black leading-tight" style={{ fontSize: "12px", color: "#14532d" }}>
                    Vote = earn a credit. Up to 5 per day.
                  </p>
                  <p className="leading-tight mt-0.5" style={{ fontSize: "11px", color: "#15803d" }}>
                    Credits buy you peer reviews for your own music.
                  </p>
                </div>
                <span
                  className="flex-shrink-0 font-black uppercase"
                  style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#16a34a" }}
                >
                  Listen 30s first
                </span>
              </div>

              {/* Entries */}
              <div
                className="overflow-hidden"
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  border: "1px solid #e8deff",
                }}
              >
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

              {/* Stats footer */}
              <div className="flex items-center justify-center gap-4 mt-6 pb-2">
                <span
                  className="font-black uppercase"
                  style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#c4b3f7" }}
                >
                  {chartData.totalSubmissions} track{chartData.totalSubmissions !== 1 ? "s" : ""}
                </span>
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "#d4c3ff" }}
                />
                <span
                  className="font-black uppercase"
                  style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#c4b3f7" }}
                >
                  {chartData.leaderboard.reduce((sum, e) => sum + e.voteCount, 0)} votes
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div
                className="flex items-center justify-center mx-auto mb-5"
                style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: "#2d1b69" }}
              >
                <Music style={{ width: 26, height: 26, color: "#c4b3f7" }} />
              </div>
              <h3
                className="font-black"
                style={{ fontSize: "1.25rem", color: "#2d1b69", letterSpacing: "-0.02em" }}
              >
                {isToday ? "No tracks yet" : "No tracks this day"}
              </h3>
              <p
                className="font-medium mt-2 mx-auto leading-relaxed"
                style={{ fontSize: "13px", color: "#9d7fd4", maxWidth: 280 }}
              >
                {isToday
                  ? "Be the first to drop your track and claim the top spot."
                  : "Check today's chart for the latest submissions."}
              </p>
              {isToday && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="mt-6 inline-flex items-center gap-1.5 font-black uppercase transition-all"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    padding: "10px 24px",
                    borderRadius: 999,
                    backgroundColor: "#2d1b69",
                    color: "#fff",
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} />
                  Submit your track
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 5 — YOUR ACTIVITY ══ deep indigo ══════════════════ */}
      <div style={{ backgroundColor: "#2d1b69" }} className="py-12">
        <div className="max-w-3xl mx-auto px-6 sm:px-10">
          <YourActivity onViewAnalytics={(id) => setAnalyticsSubmissionId(id)} />
        </div>
      </div>

      {/* Modals */}
      <SubmitToChart
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmitted={handleSubmitted}
      />
      <ChartAnalytics
        submissionId={analyticsSubmissionId}
        onClose={() => setAnalyticsSubmissionId(null)}
      />
    </div>
  );
}
