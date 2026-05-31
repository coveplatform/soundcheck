"use client";

import { useMemo } from "react";
import { ScoreTrendChart } from "./score-trend-chart";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface TrackData {
  id: string;
  title: string;
  artworkUrl: string | null;
  createdAt: Date;
  completedAt: Date | null;
  reviewsCompleted: number;
  avgScore: number;
  categoryScores: { production: number; vocals: number; originality: number };
  engagement: { listenAgain: number; playlist: number; share: number };
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
  trendData: Array<{ month: string; production: number; vocals: number; originality: number; overall: number }>;
  reviewVelocity: any;
  feedbackPatterns: any;
  qualityLevels?: any;
  technicalIssues?: any[];
  nextFocusData?: any;
  playlistActionsData?: any;
  topQuickWins?: string[];
}

function scoreColor(score: number) {
  if (score >= 4.0) return "text-lime-400";
  if (score >= 3.5) return "text-white";
  return "text-white/40";
}

export function AnalyticsDashboard({
  tracks,
  totalReviews,
  overallAvg,
  highestScore,
  improvementRate,
  categories,
  trendData,
}: AnalyticsDashboardProps) {
  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => b.avgScore - a.avgScore),
    [tracks]
  );

  const production = categories.find((c) => c.name === "Production")?.score ?? 0;
  const originality = categories.find((c) => c.name === "Originality")?.score ?? 0;
  const vocals = categories.find((c) => c.name === "Vocals")?.score ?? 0;

  const trendPositive = improvementRate > 5;
  const trendNegative = improvementRate < -5;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">

      {/* ── HERO — dark, big numbers ───────────────────────── */}
      <div className="bg-[#0d0d0d] px-6 sm:px-8 pt-7 pb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.55em] text-white/50 mb-8">Insights</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-5xl sm:text-6xl font-black text-white tabular-nums leading-none tracking-tighter">
              {totalReviews}
            </p>
            <Tooltip content="Total number of reviews your tracks have received across all your submissions.">
              <div className="flex items-center gap-1.5 mt-3">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/55">Reviews</p>
                <Info className="h-3 w-3 text-white/20" />
              </div>
            </Tooltip>
            <p className="text-[9px] text-white/15 mt-1">across all tracks</p>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-5xl sm:text-6xl font-black text-white tabular-nums leading-none tracking-tighter">
                {overallAvg.toFixed(1)}
              </p>
              <span className="text-xl font-black text-white/20">/ 5</span>
            </div>
            <Tooltip content="Your average score across all reviews. 4.0+ is strong, 3.0 is about average on this platform.">
              <div className="flex items-center gap-1.5 mt-3">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/55">Avg Score</p>
                <Info className="h-3 w-3 text-white/20" />
              </div>
            </Tooltip>
            <p className="text-[9px] text-white/15 mt-1">4.0+ is strong</p>
          </div>
          <div>
            <p className={cn(
              "text-5xl sm:text-6xl font-black tabular-nums leading-none tracking-tighter",
              trendPositive ? "text-lime-400" : trendNegative ? "text-red-400" : "text-white/25"
            )}>
              {trendPositive ? "+" : ""}{Math.round(improvementRate)}%
            </p>
            <Tooltip content="Compares your most recent track's score to your earlier tracks. Green means your music is scoring better over time.">
              <div className="flex items-center gap-1.5 mt-3">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/55">
                  {trendPositive ? "Improving" : trendNegative ? "Dipping" : "Trend"}
                </p>
                <Info className="h-3 w-3 text-white/20" />
              </div>
            </Tooltip>
            <p className="text-[9px] text-white/15 mt-1">vs your earlier tracks</p>
          </div>
        </div>
      </div>

      {/* ── CATEGORY SCORES — 3 color blocks ──────────────── */}
      <div className="grid grid-cols-3 border-t-2 border-black divide-x-2 divide-black">
        {/* Production — lime */}
        <div className="bg-lime-400 px-4 sm:px-6 py-7">
          <div className="flex items-baseline gap-1">
            <p className="text-4xl sm:text-5xl font-black text-black tabular-nums leading-none tracking-tighter">
              {production.toFixed(1)}
            </p>
            <span className="text-base font-black text-black/25">/ 5</span>
          </div>
          <Tooltip content="How polished your mix sounds — clarity, balance, and technical execution. 4.0+ is professional quality.">
            <div className="flex items-center gap-1.5 mt-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/65">Production</p>
              <Info className="h-3 w-3 text-black/30" />
            </div>
          </Tooltip>
        </div>

        {/* Originality — black */}
        <div className="bg-[#0d0d0d] px-4 sm:px-6 py-7">
          <div className="flex items-baseline gap-1">
            <p className="text-4xl sm:text-5xl font-black text-white tabular-nums leading-none tracking-tighter">
              {originality.toFixed(1)}
            </p>
            <span className="text-base font-black text-white/20">/ 5</span>
          </div>
          <Tooltip content="How fresh and distinctive your sound feels to listeners. Higher scores mean reviewers found it unique and memorable.">
            <div className="flex items-center gap-1.5 mt-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/55">Originality</p>
              <Info className="h-3 w-3 text-white/20" />
            </div>
          </Tooltip>
        </div>

        {/* Vocals — violet */}
        <div className="bg-violet-600 px-4 sm:px-6 py-7">
          <div className="flex items-baseline gap-1">
            <p className="text-4xl sm:text-5xl font-black text-white tabular-nums leading-none tracking-tighter">
              {vocals.toFixed(1)}
            </p>
            <span className="text-base font-black text-white/30">/ 5</span>
          </div>
          <Tooltip content="How clearly your vocals cut through the mix. A low score means reviewers felt they were too buried. Shown as 0 for instrumentals.">
            <div className="flex items-center gap-1.5 mt-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70">Vocals</p>
              <Info className="h-3 w-3 text-white/30" />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* ── SCORE TREND — only with enough data ───────────── */}
      {trendData.length >= 2 && (
        <div className="bg-[#faf7f2] border-t-2 border-black px-5 sm:px-7 py-7">
          <p className="text-[9px] font-black uppercase tracking-[0.45em] text-black/55 mb-6">Score Over Time</p>
          <ScoreTrendChart data={trendData} />
        </div>
      )}

      {/* ── TRACK LIST ────────────────────────────────────── */}
      {sortedTracks.length > 0 && (
        <div className="bg-[#0d0d0d] border-t-2 border-black px-5 sm:px-7 py-6">
          <p className="text-[9px] font-black uppercase tracking-[0.45em] text-white/50 mb-5">Tracks Ranked</p>
          <div>
            {sortedTracks.map((track, i) => (
              <div
                key={track.id}
                className="flex items-center gap-4 py-4 border-b border-white/[0.05] last:border-0"
              >
                {/* Rank */}
                <span className="text-[11px] font-black text-white/10 w-5 tabular-nums leading-none flex-shrink-0">
                  {i + 1}
                </span>

                {/* Title + review count */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white leading-none truncate">{track.title}</p>
                  <p className="text-[10px] text-white/25 font-mono mt-1.5 tabular-nums">
                    {track.reviewsCompleted} review{track.reviewsCompleted !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-baseline gap-0.5 flex-shrink-0">
                  <p className={cn("text-xl font-black tabular-nums leading-none", scoreColor(track.avgScore))}>
                    {track.avgScore.toFixed(1)}
                  </p>
                  <span className="text-[10px] font-black text-white/15">/ 5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
