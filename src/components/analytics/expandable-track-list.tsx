"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, ChevronDown, ChevronUp } from "lucide-react";
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
}

interface ExpandableTrackListProps {
  tracks: TrackData[];
  variant?: "top" | "all";
}

export function ExpandableTrackList({ tracks, variant = "all" }: ExpandableTrackListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {tracks.map((track, index) => {
        const isExpanded = expandedId === track.id;

        return (
          <div key={track.id} className="rounded-2xl overflow-hidden border-2 border-black/8">
            {/* Main track row */}
            <button
              onClick={() => toggleExpand(track.id)}
              className="w-full p-3 bg-white hover:bg-black/[0.02] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {/* Rank badge (top variant only) */}
                {variant === "top" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black flex items-center justify-center text-white font-black text-[10px]">
                    {index + 1}
                  </div>
                )}

                {/* Artwork */}
                <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-black/8">
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                      <Music className="w-4 h-4 text-white/60" />
                    </div>
                  )}
                </div>

                {/* Title + meta + scores */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-black truncate leading-tight">{track.title}</p>
                  <p className="text-[10px] text-black/35 font-medium mt-0.5">
                    {new Date(track.createdAt).toLocaleDateString()} · {track.reviewsCompleted} {track.reviewsCompleted === 1 ? "review" : "reviews"}
                  </p>
                  {/* Score pills — always below title, never overlapping */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {[
                      { label: "Prod", value: track.categoryScores.production },
                      { label: "Orig", value: track.categoryScores.originality },
                      { label: "Vocals", value: track.categoryScores.vocals },
                    ].map((s) => (
                      <span key={s.label} className="inline-flex items-center gap-1 bg-black/5 rounded-full px-2 py-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-black/35">{s.label}</span>
                        <span className="text-[11px] font-black text-black">{s.value.toFixed(1)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Avg score + chevron */}
                <div className="flex-shrink-0 flex items-center gap-2 pl-3 border-l-2 border-black/8">
                  <div className="text-right">
                    <p className="text-2xl font-black text-black leading-none tabular-nums">{track.avgScore.toFixed(1)}</p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-black/30 mt-0.5">avg</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-black/30 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-black/30 flex-shrink-0" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="bg-white/50 border-l-4 border-lime-400 p-4 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Mini analytics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-black/5">
                    <p className="text-xs font-mono text-black/40 uppercase mb-1">Listen Again</p>
                    <p className="text-2xl font-black">{track.engagement.listenAgain}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-black/5">
                    <p className="text-xs font-mono text-black/40 uppercase mb-1">Playlist</p>
                    <p className="text-2xl font-black">{track.engagement.playlist}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-black/5">
                    <p className="text-xs font-mono text-black/40 uppercase mb-1">Share</p>
                    <p className="text-2xl font-black">{track.engagement.share}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-black/5">
                    <p className="text-xs font-mono text-black/40 uppercase mb-1">Reviews</p>
                    <p className="text-2xl font-black">{track.reviewsCompleted}</p>
                  </div>
                </div>

                {/* Category breakdown visual */}
                <div className="space-y-3">
                  <p className="text-xs font-mono text-black/40 uppercase">Category Breakdown</p>
                  <div className="space-y-2">
                    {[
                      { name: "Production", score: track.categoryScores.production, color: "bg-lime-500" },
                      { name: "Originality", score: track.categoryScores.originality, color: "bg-purple-500" },
                      { name: "Vocals", score: track.categoryScores.vocals, color: "bg-blue-500" },
                    ].map((category) => (
                      <div key={category.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm font-bold">{category.score.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", category.color)}
                            style={{ width: `${(category.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View full details link */}
                <Link
                  href={`/tracks/${track.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-black/70 hover:text-black transition-colors"
                >
                  View full track details →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
