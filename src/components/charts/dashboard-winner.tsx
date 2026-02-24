"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Music, ArrowRight, Play, Pause, X } from "lucide-react";

interface WinnerData {
  id: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  voteCount: number;
  artistName: string;
  artistImage: string | null;
}

function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split("?")[0] || null;
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

function getEmbedUrl(sourceType: string, sourceUrl: string): string | null {
  if (sourceType === "SOUNDCLOUD") {
    return (
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(sourceUrl)}` +
      `&color=%239333ea&auto_play=true&hide_related=true` +
      `&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
    );
  }
  if (sourceType === "YOUTUBE") {
    const videoId = getYouTubeId(sourceUrl);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }
  return null;
}

export function DashboardWinner() {
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopTimer = useCallback(() => {}, []);

  useEffect(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split("T")[0];

    fetch(`/api/charts?date=${dateStr}&period=daily`)
      .then((res) => res.json())
      .then((data) => {
        if (data.featuredWinner) {
          setWinner(data.featuredWinner);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [stopTimer]);

  if (!winner) return null;

  const embedUrl = getEmbedUrl(winner.sourceType, winner.sourceUrl);
  const canEmbed = embedUrl !== null;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      setIsPlaying(false);
      setIsExpanded(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsPlaying(true);

      if (winner.sourceType === "UPLOAD" && winner.sourceUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(winner.sourceUrl);
          audioRef.current.addEventListener("ended", () => {
            setIsPlaying(false);
          });
        }
        audioRef.current.play().catch(() => {});
      } else if (canEmbed) {
        setIsExpanded(true);
      } else {
        window.open(winner.sourceUrl, "_blank");
        setIsPlaying(false);
      }
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(false);
    setIsExpanded(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div className="bg-black">
      {/* Main strip */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
        <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />

        {/* Artwork + play button */}
        <button
          onClick={handlePlay}
          className="flex-shrink-0 relative w-8 h-8 rounded-md overflow-hidden group/play"
        >
          {winner.artworkUrl ? (
            <Image
              src={winner.artworkUrl}
              alt={winner.title}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <Music className="w-3 h-3 text-neutral-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 group-hover/play:bg-black/60 transition-colors flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5 text-white" />
            ) : (
              <Play className="w-2.5 h-2.5 text-white ml-px" />
            )}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-white/40">
            <span className="font-black text-amber-400">Track of the Day</span>
            {" — "}
            <span className="font-bold text-white truncate">{winner.title}</span>
            {" by "}
            <span className="text-white/60">{winner.artistName}</span>
          </p>
        </div>

        {isExpanded && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3 text-white/40" />
          </button>
        )}

        <Link
          href="/charts"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 text-white/30" />
        </Link>
      </div>

      {/* Inline embed */}
      {isExpanded && embedUrl && (
        <div className="border-t border-white/10">
          {winner.sourceType === "SOUNDCLOUD" && (
            <iframe
              src={embedUrl}
              height="120"
              width="100%"
              allow="autoplay"
              className="block"
              style={{ border: "none" }}
            />
          )}
          {winner.sourceType === "YOUTUBE" && (
            <div className="relative w-full max-w-4xl mx-auto" style={{ paddingBottom: "40%" }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ border: "none" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
