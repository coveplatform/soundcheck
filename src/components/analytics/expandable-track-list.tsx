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
  earnings: number;
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
          <div key={track.id} className="rounded-xl overflow-hidden">
            {/* Main track row */}
            <button
              onClick={() => toggleExpand(track.id)}
              className="w-full p-3 sm:p-4 rounded-lg bg-white hover:bg-black/5 border border-black/5 hover:border-black/10 transition-all text-left"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {variant === "top" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white font-black text-sm">
                    {index + 1}
                  </div>
                )}

                {track.artworkUrl ? (
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-white/30" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm sm:text-base">{track.title}</p>
                    <p className="text-xs text-black/50">
                      {new Date(track.createdAt).toLocaleDateString()} · {track.reviewsCompleted} reviews
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex gap-2">
                      <div className="text-center">
                        <p className="text-xs text-black/40">Prod</p>
                        <p className="text-sm font-bold">
                          {track.categoryScores.production.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-black/40">Orig</p>
                        <p className="text-sm font-bold">
                          {track.categoryScores.originality.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-black/40">Vocals</p>
                        <p className="text-sm font-bold">
                          {track.categoryScores.vocals.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right pl-3 sm:pl-4 border-l border-black/10 flex items-center gap-2">
                      <div>
                        <p className="text-xl sm:text-2xl font-black">{track.avgScore.toFixed(1)}</p>
                        <p className="text-xs text-black/40">avg</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-black/40" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-black/40" />
                      )}
                    </div>
                  </div>
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
                    <p className="text-xs font-mono text-black/40 uppercase mb-1">Earnings</p>
                    <p className="text-2xl font-black">${track.earnings.toFixed(2)}</p>
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
                  href={`/artist/tracks/${track.id}`}
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
