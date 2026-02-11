"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TimePeriodSelector, TimePeriod } from "./time-period-selector";
import { ScoreTrendChart } from "./score-trend-chart";
import { ExpandableTrackList } from "./expandable-track-list";
import { EarningsChart } from "./earnings-chart";
import { ReviewVelocity } from "./review-velocity";
import { FeedbackPatterns } from "./feedback-patterns";
import {
  Music,
  Award,
  Sparkles,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Zap,
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
  earnings: number;
}

interface AnalyticsDashboardProps {
  tracks: TrackData[];
  totalReviews: number;
  totalEarnings: number;
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
  earningsData: Array<{
    month: string;
    earnings: number;
    trackCount: number;
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
}

export function AnalyticsDashboard({
  tracks,
  totalReviews,
  totalEarnings,
  totalTracks,
  overallAvg,
  highestScore,
  improvementRate,
  wouldListenAgainPercent,
  categories,
  trendData,
  earningsData,
  reviewVelocity,
  feedbackPatterns,
}: AnalyticsDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");

  // Filter tracks based on time period
  const filteredTracks = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    if (timePeriod === "30d") {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (timePeriod === "3m") {
      cutoffDate.setMonth(now.getMonth() - 3);
    } else {
      return tracks;
    }

    return tracks.filter((track) => new Date(track.createdAt) >= cutoffDate);
  }, [tracks, timePeriod]);

  // Recalculate stats for filtered data
  const filteredStats = useMemo(() => {
    if (filteredTracks.length === 0) {
      return {
        totalReviews: 0,
        avgScore: 0,
        totalEarnings: 0,
        listenAgainPercent: 0,
      };
    }

    const reviews = filteredTracks.reduce((sum, t) => sum + t.reviewsCompleted, 0);
    const avgScore =
      filteredTracks.reduce((sum, t) => sum + t.avgScore, 0) / filteredTracks.length;
    const earnings = filteredTracks.reduce((sum, t) => sum + t.earnings, 0);
    const listenAgain =
      filteredTracks.reduce((sum, t) => sum + t.engagement.listenAgain, 0) /
      filteredTracks.length;

    return {
      totalReviews: reviews,
      avgScore,
      totalEarnings: earnings,
      listenAgainPercent: Math.round(listenAgain),
    };
  }, [filteredTracks]);

  const topTracks = useMemo(() => {
    return [...filteredTracks].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
  }, [filteredTracks]);

  const displayStats = timePeriod === "all"
    ? { totalReviews, avgScore: overallAvg, totalEarnings, listenAgainPercent: wouldListenAgainPercent }
    : filteredStats;

  return (
    <div className="space-y-12">
      {/* HERO SECTION - MASSIVE REVIEW COUNT */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-yellow-50 to-orange-50 opacity-50" />
        <div className="relative bg-gradient-to-br from-purple-400/10 to-green-400/10 rounded-3xl border-2 border-purple-300 p-6 sm:p-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-black/10 mb-6">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-black/70 uppercase tracking-wider">
                Total Feedback Received
              </span>
            </div>

            <div className="mb-6">
              <div className="text-[72px] sm:text-[96px] lg:text-[120px] font-black leading-none tracking-tighter bg-gradient-to-br from-purple-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">
                {displayStats.totalReviews}
              </div>
              <p className="text-lg sm:text-xl font-bold text-black/80 mt-3">
                Professional Review{displayStats.totalReviews === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-black">{displayStats.avgScore.toFixed(1)}</p>
                <p className="text-sm text-black/60 mt-1">Avg Score</p>
              </div>
              <div className="w-px h-12 bg-black/10" />
              <div>
                <p className="text-3xl sm:text-4xl font-black">{filteredTracks.length}</p>
                <p className="text-sm text-black/60 mt-1">Track{filteredTracks.length === 1 ? "" : "s"}</p>
              </div>
              <div className="w-px h-12 bg-black/10" />
              <div>
                <p className="text-3xl sm:text-4xl font-black">${displayStats.totalEarnings.toFixed(0)}</p>
                <p className="text-sm text-black/60 mt-1">Earned</p>
              </div>
            </div>

            {improvementRate > 5 && (
              <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-purple-400 shadow-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold">
                  You've improved by {improvementRate.toFixed(0)}% - keep it up!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Detailed Analytics</h2>
          <p className="text-sm text-black/60">
            {timePeriod === "all" ? "All time data" : `Last ${timePeriod === "30d" ? "30 days" : "3 months"}`}
          </p>
        </div>
        <TimePeriodSelector selected={timePeriod} onChange={setTimePeriod} />
      </div>

      {/* EARNINGS ANALYSIS */}
      {(totalEarnings > 0 || earningsData.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-black">Earnings Analysis</h3>
          </div>
          <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
            <CardContent className="pt-6">
              <EarningsChart data={earningsData} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* SCORE TRENDS */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-black">Score Trends Over Time</h3>
        </div>
        <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <ScoreTrendChart data={trendData} />
          </CardContent>
        </Card>
      </section>

      {/* CATEGORY STRENGTHS */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-black">Your Strengths</h3>
        </div>
        <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {categories.map((category, index) => {
                const percentage = (category.score / 5) * 100;
                return (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Award className="h-4 w-4 text-purple-600" />}
                        <span className="text-sm font-bold">{category.name}</span>
                      </div>
                      <span className="text-lg font-black">{category.score.toFixed(1)}</span>
                    </div>
                    <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", category.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* REVIEW VELOCITY */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-black">Review Velocity</h3>
        </div>
        <ReviewVelocity
          avgTimeToComplete={reviewVelocity.avgTimeToComplete}
          fastestTrack={reviewVelocity.fastestTrack}
          slowestTrack={reviewVelocity.slowestTrack}
          reviewsPerWeek={reviewVelocity.reviewsPerWeek}
          totalReviews={totalReviews}
        />
      </section>

      {/* FEEDBACK PATTERNS */}
      {(feedbackPatterns.commonPraise.length > 0 || feedbackPatterns.commonCritiques.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-black">Feedback Patterns</h3>
          </div>
          <FeedbackPatterns
            commonPraise={feedbackPatterns.commonPraise}
            commonCritiques={feedbackPatterns.commonCritiques}
            improvingAreas={feedbackPatterns.improvingAreas}
            consistentStrengths={feedbackPatterns.consistentStrengths}
          />
        </section>
      )}

      {/* TRACK PERFORMANCE */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Music className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-black">Track Performance</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Tracks */}
          <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
            <CardContent className="pt-6">
              <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
                Top Performing Tracks
              </p>
              {topTracks.length > 0 ? (
                <ExpandableTrackList tracks={topTracks} variant="top" />
              ) : (
                <p className="text-sm text-black/40 text-center py-8">No tracks in this period</p>
              )}
            </CardContent>
          </Card>

          {/* All Tracks */}
          <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
            <CardContent className="pt-6">
              <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
                All Tracks
              </p>
              {filteredTracks.length > 0 ? (
                <ExpandableTrackList tracks={filteredTracks} variant="all" />
              ) : (
                <p className="text-sm text-black/40 text-center py-8">No tracks in this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
