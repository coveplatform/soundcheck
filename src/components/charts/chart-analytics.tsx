"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Loader2,
  BarChart3,
  Clock,
  Users,
  Play,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  submissionId: string;
  title: string;
  voteCount: number;
  playCount: number;
  rank: number | null;
  date: string;
  conversionRate: number;
  avgListenDuration: number;
  voters: {
    name: string;
    image: string | null;
    listenDuration: number;
    votedAt: string;
  }[];
  timeline: { hour: string; count: number }[];
}

interface ChartAnalyticsProps {
  submissionId: string | null;
  onClose: () => void;
}

export function ChartAnalytics({ submissionId, onClose }: ChartAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    setIsLoading(true);
    setError(null);

    fetch(`/api/charts/analytics?submissionId=${submissionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAnalytics(data.analytics);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load analytics");
        setIsLoading(false);
      });
  }, [submissionId]);

  if (!submissionId) return null;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const maxTimelineCount = analytics
    ? Math.max(...analytics.timeline.map((t) => t.count), 1)
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-black text-black">Chart Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4 text-black/40" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-black/20 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-16 px-5">
            <p className="text-sm text-black/50">{error}</p>
          </div>
        )}

        {analytics && (
          <div className="px-5 py-4 space-y-5">
            {/* Title */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-black/25">
                {new Date(analytics.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {analytics.rank && ` · Rank #${analytics.rank}`}
              </p>
              <h3 className="text-lg font-black text-black mt-0.5 truncate">
                {analytics.title}
              </h3>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-px bg-black/5 rounded-xl overflow-hidden">
              {[
                {
                  icon: ChevronUp,
                  value: analytics.voteCount,
                  label: "Votes",
                },
                {
                  icon: Play,
                  value: analytics.playCount,
                  label: "Plays",
                },
                {
                  icon: TrendingUp,
                  value: `${analytics.conversionRate}%`,
                  label: "Convert",
                },
                {
                  icon: Clock,
                  value: formatDuration(analytics.avgListenDuration),
                  label: "Avg Listen",
                },
              ].map((metric) => (
                <div key={metric.label} className="bg-white p-3 text-center">
                  <metric.icon className="w-3.5 h-3.5 text-black/20 mx-auto mb-1" />
                  <p className="text-base font-black text-black tabular-nums">
                    {metric.value}
                  </p>
                  <p className="text-[9px] font-bold text-black/30 uppercase tracking-wider">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Vote timeline */}
            {analytics.timeline.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/25 mb-3">
                  Vote Timeline (UTC)
                </p>
                <div className="flex items-end gap-0.5 h-16">
                  {analytics.timeline.map((t) => (
                    <div
                      key={t.hour}
                      className="flex-1 flex flex-col items-center gap-0.5"
                    >
                      <div
                        className="w-full bg-purple-500 rounded-sm min-h-[2px] transition-all"
                        style={{
                          height: `${(t.count / maxTimelineCount) * 100}%`,
                        }}
                      />
                      <span className="text-[7px] text-black/20 tabular-nums">
                        {t.hour.split(":")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voters list */}
            {analytics.voters.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/25">
                    <Users className="w-3 h-3 inline -mt-0.5 mr-1" />
                    Voters ({analytics.voters.length})
                  </p>
                </div>
                <div className="space-y-0">
                  {analytics.voters.map((voter, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 py-2.5",
                        i > 0 && "border-t border-black/5"
                      )}
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-neutral-100">
                        {voter.image ? (
                          <Image
                            src={voter.image}
                            alt={voter.name}
                            width={28}
                            height={28}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-black/30">
                            {voter.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-black truncate">
                          {voter.name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[10px] text-black/40 tabular-nums">
                          {formatDuration(voter.listenDuration)} listened
                        </p>
                        <p className="text-[9px] text-black/20">
                          {formatTime(voter.votedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
