"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TimePeriodSelector, TimePeriod } from "./time-period-selector";
import { ScoreTrendChart } from "./score-trend-chart";
import { ExpandableTrackList } from "./expandable-track-list";
import { ReviewVelocity } from "./review-velocity";
import { FeedbackPatterns } from "./feedback-patterns";
import {
  Music,
  Award,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Zap,
  BarChart3,
  ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryScore {
  production: number;
  vocals: number;
  originality: number;
}

interface TrackData {
  id: string;
  title: string;
  artworkUrl: string | null;
  createdAt: Date;
  completedAt: Date | null;
  reviewsCompleted: number;
  avgScore: number;
  categoryScores: CategoryScore;
  engagement: {
    listenAgain: number;
    playlist: number;
    share: number;
  };
}

interface AnalyticsDashboardProps {
  tracks: TrackData[];
  totalReviews: number;
  totalTracks: number;
  overallAvg: number;
  highestScore: number;
  improvementRate: number;
  wouldListenAgainPercent: number;
  categories: Array<{ name: string; score: number; color: string }>;
  trendData: Array<{
    month: string;
    production: number;
    vocals: number;
    originality: number;
    overall: number;
  }>;
  reviewVelocity: {
    avgTimeToComplete: number;
    fastestTrack: { title: string; days: number } | null;
    slowestTrack: { title: string; days: number } | null;
    reviewsPerWeek: number;
  };
  feedbackPatterns: {
    commonPraise: Array<{ word: string; count: number }>;
    commonCritiques: Array<{ word: string; count: number }>;
    improvingAreas: string[];
    consistentStrengths: string[];
  };
  qualityLevels?: any;
  technicalIssues?: any[];
  nextFocusData?: any;
  playlistActionsData?: any;
  topQuickWins?: string[];
}

type InsightTab = "overview" | "scores" | "feedback" | "tracks";

const TABS: { id: InsightTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "scores", label: "Scores", icon: TrendingUp },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "tracks", label: "Tracks", icon: ListMusic },
];

export function AnalyticsDashboard({
  tracks,
  totalReviews,
  totalTracks,
  overallAvg,
  highestScore,
  improvementRate,
  wouldListenAgainPercent,
  categories,
  trendData,
  reviewVelocity,
  feedbackPatterns,
  qualityLevels,
  technicalIssues = [],
  nextFocusData,
  playlistActionsData,
  topQuickWins = [],
}: AnalyticsDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [activeTab, setActiveTab] = useState<InsightTab>("overview");

  const filteredTracks = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    if (timePeriod === "30d") cutoffDate.setDate(now.getDate() - 30);
    else if (timePeriod === "3m") cutoffDate.setMonth(now.getMonth() - 3);
    else return tracks;
    return tracks.filter((track) => new Date(track.createdAt) >= cutoffDate);
  }, [tracks, timePeriod]);

  const filteredStats = useMemo(() => {
    if (filteredTracks.length === 0) return { totalReviews: 0, avgScore: 0, listenAgainPercent: 0 };
    const reviews = filteredTracks.reduce((sum, t) => sum + t.reviewsCompleted, 0);
    const avgScore = filteredTracks.reduce((sum, t) => sum + t.avgScore, 0) / filteredTracks.length;
    const listenAgain = filteredTracks.reduce((sum, t) => sum + t.engagement.listenAgain, 0) / filteredTracks.length;
    return { totalReviews: reviews, avgScore, listenAgainPercent: Math.round(listenAgain) };
  }, [filteredTracks]);

  const topTracks = useMemo(
    () => [...filteredTracks].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5),
    [filteredTracks]
  );

  const displayStats =
    timePeriod === "all"
      ? { totalReviews, avgScore: overallAvg, listenAgainPercent: wouldListenAgainPercent }
      : filteredStats;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border-2 border-black/8 p-4 text-center shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
          <p className="text-3xl font-black tabular-nums">{displayStats.totalReviews}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mt-1">Reviews</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-black/8 p-4 text-center shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
          <p className="text-3xl font-black tabular-nums">{displayStats.avgScore.toFixed(1)}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mt-1">Avg Score</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-black/8 p-4 text-center shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
          <p className="text-3xl font-black tabular-nums">{displayStats.listenAgainPercent}%</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mt-1">Would Replay</p>
        </div>
      </div>

      {improvementRate > 5 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-xl">
          <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span className="text-sm font-bold text-purple-900">
            You&apos;ve improved by {improvementRate.toFixed(0)}% across your recent tracks — keep going.
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-black/5 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
              activeTab === id
                ? "bg-white text-black shadow-[2px_2px_0_rgba(0,0,0,0.08)] border border-black/8"
                : "text-black/40 hover:text-black/70"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Time period selector — shown on tabs that use filtered data */}
      {(activeTab === "scores" || activeTab === "tracks") && (
        <div className="flex justify-end">
          <TimePeriodSelector selected={timePeriod} onChange={setTimePeriod} />
        </div>
      )}

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Category strengths */}
          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-5 pb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Your Strengths</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {categories.map((category, index) => {
                const percentage = (category.score / 5) * 100;
                return (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {index === 0 && <Award className="h-3.5 w-3.5 text-purple-600" />}
                        <span className="text-[13px] font-bold">{category.name}</span>
                      </div>
                      <span className="text-[13px] font-black tabular-nums">{category.score.toFixed(1)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", category.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality level + Playlist side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {qualityLevels && (
              <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
                <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                  <Award className="w-4 h-4 text-lime-600" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Quality Rating</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {qualityLevels.distribution.map((item: any) => (
                    <div key={item.level}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold">
                          {item.level.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                        </span>
                        <span className="text-[12px] font-bold text-black/50 tabular-nums">{item.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                        <div className="h-full bg-lime-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                  {qualityLevels.releaseReady > 0 && (
                    <p className="text-[12px] font-bold text-lime-700 pt-1">
                      {qualityLevels.releaseReady} track{qualityLevels.releaseReady === 1 ? "" : "s"} rated release-ready or professional
                    </p>
                  )}
                </div>
              </div>
            )}

            {playlistActionsData && (
              <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
                <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-600" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Playlist Behaviour</p>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-3">
                  <div className="bg-lime-50 border border-lime-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-lime-700 tabular-nums">{playlistActionsData.addToLibrary}%</p>
                    <p className="text-[10px] text-lime-800 mt-0.5 font-semibold">Add to Library</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-purple-700 tabular-nums">{playlistActionsData.letPlay}%</p>
                    <p className="text-[10px] text-purple-800 mt-0.5 font-semibold">Let it Play</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-orange-700 tabular-nums">{playlistActionsData.skip}%</p>
                    <p className="text-[10px] text-orange-800 mt-0.5 font-semibold">Skip</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-red-700 tabular-nums">{playlistActionsData.dislike}%</p>
                    <p className="text-[10px] text-red-800 mt-0.5 font-semibold">Dislike</p>
                  </div>
                </div>
                <div className="mx-5 mb-5 p-3 bg-black/3 rounded-xl text-center">
                  <span className="text-xl font-black text-purple-600 tabular-nums">{playlistActionsData.positiveRate}%</span>
                  <span className="text-[12px] text-black/50 ml-1.5 font-semibold">positive engagement</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SCORES TAB ───────────────────────────────────────── */}
      {activeTab === "scores" && (
        <div className="space-y-5">
          {/* Trend chart */}
          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-5 pb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Score Trends Over Time</p>
            </div>
            <div className="px-5 py-4">
              <ScoreTrendChart data={trendData} />
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-5 pb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Review Velocity</p>
            </div>
            <div className="px-5 py-4">
              <ReviewVelocity
                avgTimeToComplete={reviewVelocity.avgTimeToComplete}
                fastestTrack={reviewVelocity.fastestTrack}
                slowestTrack={reviewVelocity.slowestTrack}
                reviewsPerWeek={reviewVelocity.reviewsPerWeek}
                totalReviews={totalReviews}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── FEEDBACK TAB ─────────────────────────────────────── */}
      {activeTab === "feedback" && (
        <div className="space-y-5">
          {(feedbackPatterns.commonPraise.length > 0 || feedbackPatterns.commonCritiques.length > 0) && (
            <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
              <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Feedback Patterns</p>
              </div>
              <div className="px-5 py-4">
                <FeedbackPatterns
                  commonPraise={feedbackPatterns.commonPraise}
                  commonCritiques={feedbackPatterns.commonCritiques}
                  improvingAreas={feedbackPatterns.improvingAreas}
                  consistentStrengths={feedbackPatterns.consistentStrengths}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {nextFocusData && (
              <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
                <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Focus Areas</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {nextFocusData.recommendations.slice(0, 4).map((rec: any) => (
                    <div key={rec.focus}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold">
                          {rec.focus.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                        </span>
                        <span className="text-[11px] font-mono text-black/40 tabular-nums">{rec.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rec.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                  {nextFocusData.readyToRelease > 0 && (
                    <p className="text-[12px] font-bold text-purple-700 pt-1">
                      {nextFocusData.readyToRelease} reviewer{nextFocusData.readyToRelease === 1 ? "" : "s"} said you&apos;re ready to release
                    </p>
                  )}
                </div>
              </div>
            )}

            {technicalIssues.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
                <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Technical Issues</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {technicalIssues.map((issue: any, index: number) => (
                    <div key={issue.issue} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-orange-700">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[12px] font-semibold truncate">{issue.issue}</span>
                          <span className="text-[10px] font-mono text-black/40 ml-2 tabular-nums flex-shrink-0">{issue.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${issue.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {topQuickWins.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
              <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Top Quick Wins</p>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {topQuickWins.map((win: string, index: number) => (
                  <div key={index} className="flex gap-3 p-3 bg-lime-50 border border-lime-200 rounded-xl">
                    <span className="flex-shrink-0 text-base">🎯</span>
                    <p className="text-[12px] font-medium text-lime-900 leading-snug">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TRACKS TAB ───────────────────────────────────────── */}
      {activeTab === "tracks" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-5 pb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <p className="text-[11px] font-black uppercase tracking-wider text-black/50">Top Performing</p>
            </div>
            <div className="px-5 py-4">
              {topTracks.length > 0 ? (
                <ExpandableTrackList tracks={topTracks} variant="top" />
              ) : (
                <p className="text-sm text-black/40 text-center py-8">No tracks in this period</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-5 pb-1 flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-600" />
              <p className="text-[11px] font-black uppercase tracking-wider text-black/50">All Tracks</p>
            </div>
            <div className="px-5 py-4">
              {filteredTracks.length > 0 ? (
                <ExpandableTrackList tracks={filteredTracks} variant="all" />
              ) : (
                <p className="text-sm text-black/40 text-center py-8">No tracks in this period</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
