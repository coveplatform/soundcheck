"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TimePeriodSelector, TimePeriod } from "./time-period-selector";
import { ScoreTrendChart } from "./score-trend-chart";
import { ExpandableTrackList } from "./expandable-track-list";
import {
  Music,
  Award,
  Target,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Lightbulb,
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
  overallAvg: number;
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
}

export function AnalyticsDashboard({
  tracks,
  totalReviews,
  totalEarnings,
  overallAvg,
  improvementRate,
  wouldListenAgainPercent,
  categories,
  trendData,
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
      // "all" - no filtering
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

  // Top performing tracks
  const topTracks = useMemo(() => {
    return [...filteredTracks].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
  }, [filteredTracks]);

  // Generate insights
  const insights = useMemo(() => {
    const bestCategory = categories[0];
    const weakestCategory = categories[categories.length - 1];
    const highestTrack = topTracks[0];

    const result = [];

    if (highestTrack) {
      result.push(`Your top track "${highestTrack.title}" scored ${highestTrack.avgScore.toFixed(1)}/5`);
    }

    if (improvementRate > 5) {
      result.push(`You've improved by ${improvementRate.toFixed(0)}% - keep up the momentum!`);
    } else if (improvementRate < -5) {
      result.push(`Recent tracks scored lower - review feedback patterns for insights`);
    }

    if (bestCategory) {
      result.push(`${bestCategory.name} is your strongest category at ${bestCategory.score.toFixed(1)}/5`);
    }

    if (weakestCategory && weakestCategory.score < 3.5) {
      result.push(`Focus on improving ${weakestCategory.name} (currently ${weakestCategory.score.toFixed(1)}/5)`);
    }

    if (filteredStats.listenAgainPercent >= 80) {
      result.push(`${filteredStats.listenAgainPercent}% listener retention - excellent engagement!`);
    }

    if (totalEarnings > 0) {
      result.push(`You've earned $${totalEarnings.toFixed(2)} from track purchases`);
    }

    return result;
  }, [categories, improvementRate, topTracks, filteredStats, totalEarnings]);

  const displayStats = timePeriod === "all"
    ? { totalReviews, avgScore: overallAvg, totalEarnings, listenAgainPercent: wouldListenAgainPercent }
    : filteredStats;

  return (
    <div className="space-y-8">
      {/* Time Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Your Performance</h2>
          <p className="text-sm text-black/60">Showing {filteredTracks.length} track{filteredTracks.length === 1 ? "" : "s"}</p>
        </div>
        <TimePeriodSelector selected={timePeriod} onChange={setTimePeriod} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                  Total Reviews
                </p>
                <p className="text-3xl font-black">{displayStats.totalReviews}</p>
                <p className="text-xs text-black/50 mt-1">
                  Across {filteredTracks.length} track{filteredTracks.length === 1 ? "" : "s"}
                </p>
              </div>
              <Music className="h-8 w-8 text-black/20" />
            </div>
          </CardContent>
        </Card>

        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                  Overall Score
                </p>
                <p className="text-3xl font-black">{displayStats.avgScore.toFixed(1)}</p>
                <p className="text-xs text-black/50 mt-1">Out of 5.0</p>
              </div>
              <Award className="h-8 w-8 text-black/20" />
            </div>
          </CardContent>
        </Card>

        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                  Total Earnings
                </p>
                <p className="text-3xl font-black">${displayStats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-black/50 mt-1">From purchases</p>
              </div>
              <DollarSign className="h-8 w-8 text-black/20" />
            </div>
          </CardContent>
        </Card>

        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                  Engagement
                </p>
                <p className="text-3xl font-black">{displayStats.listenAgainPercent}%</p>
                <p className="text-xs text-black/50 mt-1">Would listen again</p>
              </div>
              <Sparkles className="h-8 w-8 text-black/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card variant="soft" elevated className="bg-gradient-to-br from-lime-50 to-yellow-50 border-2 border-lime-200 rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-3">
                  Key Insights
                </p>
                <ul className="space-y-2">
                  {insights.map((insight, i) => (
                    <li key={i} className="text-sm font-medium text-black/80 flex items-start gap-2">
                      <span className="text-lime-600 font-black">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
              Score Trends Over Time
            </p>
            <ScoreTrendChart data={trendData} />
          </CardContent>
        </Card>
      )}

      {/* Category Strengths */}
      <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
        <CardContent className="pt-6">
          <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
            Your Strengths
          </p>
          <div className="space-y-4">
            {categories.map((category, index) => {
              const percentage = (category.score / 5) * 100;
              return (
                <div key={category.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Award className="h-4 w-4 text-lime-600" />}
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

      {/* Track Lists - Side by Side */}
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
    </div>
  );
}
