"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Lock,
  Music,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityData {
  isPro: boolean;
  maxSlots: number;
  slotsUsed: number;
  canSubmit: boolean;
  pastSubmissions: {
    id: string;
    title: string;
    artworkUrl: string | null;
    voteCount: number;
    playCount: number;
    rank: number | null;
    isFeatured: boolean;
    date: string;
  }[];
  stats: {
    totalSubmissions: number;
    totalVotesReceived: number;
    wins: number;
    bestRank: number | null;
  };
}

interface YourActivityProps {
  onViewAnalytics?: (submissionId: string) => void;
}

export function YourActivity({ onViewAnalytics }: YourActivityProps) {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/charts/activity")
      .then((res) => res.json())
      .then((data) => {
        setActivity(data.activity);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;
  if (!activity) return null;

  const { pastSubmissions, stats, isPro } = activity;

  // Nothing to show if no history
  if (stats.totalSubmissions === 0 && pastSubmissions.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-black/5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Your History</p>
          <h3 className="text-lg font-black text-black tracking-tight mt-0.5 leading-none">
            {stats.totalSubmissions} entr{stats.totalSubmissions === 1 ? "y" : "ies"}
          </h3>
        </div>
        {stats.wins > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black text-amber-600 tabular-nums">
              {stats.wins} win{stats.wins !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── PAST RESULTS ───────────────────────────────────────── */}
      {pastSubmissions.length > 0 && (
        <div>
          <div className="px-5 py-3 border-b border-black/5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25">Past Results</p>
          </div>
          <div className="px-5 py-2">
            {pastSubmissions.slice(0, 5).map((sub, i) => (
              <div
                key={sub.id}
                className={cn("flex items-center gap-3 py-2.5", i > 0 && "border-t border-black/5")}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-7 text-center">
                  {sub.isFeatured ? (
                    <Trophy className="w-3.5 h-3.5 text-amber-500 mx-auto" />
                  ) : sub.rank ? (
                    <span className={cn(
                      "text-[11px] font-black tabular-nums",
                      sub.rank <= 3 ? "text-black/60" : "text-black/25"
                    )}>#{sub.rank}</span>
                  ) : (
                    <span className="text-[11px] text-black/15">—</span>
                  )}
                </div>

                {/* Artwork */}
                <div className="flex-shrink-0 relative w-7 h-7 rounded-lg overflow-hidden border border-black/5">
                  {sub.artworkUrl ? (
                    <Image src={sub.artworkUrl} alt={sub.title} fill className="object-cover" sizes="28px" />
                  ) : (
                    <div className="w-full h-full bg-neutral-100" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-black truncate">{sub.title}</p>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] font-bold text-black/50 tabular-nums">
                    {sub.voteCount} vote{sub.voteCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[9px] text-black/25">{formatDate(sub.date)}</p>
                </div>

                {isPro && onViewAnalytics && (
                  <button
                    onClick={() => onViewAnalytics(sub.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-neutral-50 transition-colors"
                  >
                    <BarChart3 className="w-3 h-3 text-purple-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      {stats.totalSubmissions > 0 && (
        <div className="border-t-2 border-black/5 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-xl font-black text-black tabular-nums">{stats.totalVotesReceived}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-black/25">Total Votes</p>
            </div>
            {stats.bestRank && (
              <div>
                <p className="text-xl font-black text-black tabular-nums">#{stats.bestRank}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-black/25">Best Rank</p>
              </div>
            )}
          </div>

          {!isPro && stats.totalSubmissions > 0 && (
            <Link
              href="/pro"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <Lock className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-black text-purple-700">Unlock analytics</span>
              <Crown className="w-3 h-3 text-purple-400" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
