"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  ChevronUp,
  Play,
  Pause,
  Music,
  Crown,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartEntryProps {
  id: string;
  rank: number;
  title: string;
  artistName: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  genre: string | null;
  genres?: string[];
  voteCount: number;
  playCount: number;
  isPro: boolean;
  hasVoted: boolean;
  isOwn: boolean;
  isFeatured: boolean;
  onVote: (submissionId: string, listenDuration: number) => Promise<{ creditEarned: boolean }>;
  onUnvote: (submissionId: string) => Promise<void>;
  onPlay: (submissionId: string) => void;
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

export function ChartEntry({
  id,
  rank,
  title,
  artistName,
  artworkUrl,
  sourceUrl,
  sourceType,
  genre,
  genres,
  voteCount,
  isPro,
  hasVoted: initialHasVoted,
  isOwn,
  onVote,
  onUnvote,
  onPlay,
}: ChartEntryProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [votes, setVotes] = useState(voteCount);
  const [isVoting, setIsVoting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const [hasListenedEnough, setHasListenedEnough] = useState(false);
  const [showListenHint, setShowListenHint] = useState(false);
  const [showCreditFlash, setShowCreditFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MIN_LISTEN = 30;
  const embedUrl = getEmbedUrl(sourceType, sourceUrl);
  const canEmbed = embedUrl !== null;

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setListenSeconds((prev) => {
        const next = prev + 1;
        if (next >= MIN_LISTEN) setHasListenedEnough(true);
        return next;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handlePlay = () => {
    if (isPlaying) {
      // Stop / collapse
      setIsPlaying(false);
      setIsExpanded(false);
      stopTimer();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      // Start
      setIsPlaying(true);
      startTimer();
      onPlay(id);

      if (sourceType === "UPLOAD" && sourceUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(sourceUrl);
          audioRef.current.addEventListener("ended", () => {
            setIsPlaying(false);
            stopTimer();
          });
        }
        audioRef.current.play().catch(() => {});
      } else if (canEmbed) {
        // Expand inline embed (SoundCloud / YouTube)
        setIsExpanded(true);
      } else {
        // Bandcamp or unknown — open in new tab
        window.open(sourceUrl, "_blank");
      }
    }
  };

  const handleVote = async () => {
    if (isOwn || isVoting) return;

    if (hasVoted) {
      setIsVoting(true);
      try {
        await onUnvote(id);
        setHasVoted(false);
        setVotes((v) => Math.max(0, v - 1));
      } catch {
        // revert on error
      } finally {
        setIsVoting(false);
      }
      return;
    }

    if (!hasListenedEnough) {
      setShowListenHint(true);
      setTimeout(() => setShowListenHint(false), 3000);
      return;
    }

    setIsVoting(true);
    try {
      const result = await onVote(id, listenSeconds);
      setHasVoted(true);
      setVotes((v) => v + 1);
      if (result.creditEarned) {
        setShowCreditFlash(true);
        setTimeout(() => setShowCreditFlash(false), 2500);
      }
    } catch {
      // revert on error
    } finally {
      setIsVoting(false);
    }
  };

  const displayGenre = genres && genres.length > 0 ? genres[0] : genre;

  return (
    <div className={cn(rank > 1 && "border-t border-black/5")}>

      {/* ── MAIN ROW ─────────────────────────────────────────── */}
      <div className="group flex items-center gap-3 sm:gap-4 py-3.5 px-1 transition-colors duration-150">

        {/* Rank */}
        <div className="flex-shrink-0 w-7 text-center">
          {rank <= 3 ? (
            <span className={cn(
              "text-xl font-black tabular-nums",
              rank === 1 && "text-black",
              rank === 2 && "text-black/50",
              rank === 3 && "text-black/30"
            )}>
              {rank}
            </span>
          ) : (
            <span className="text-sm font-bold text-black/20 tabular-nums">{rank}</span>
          )}
        </div>

        {/* Artwork + play button */}
        <button
          onClick={handlePlay}
          className="flex-shrink-0 relative w-11 h-11 rounded-lg overflow-hidden group/play"
        >
          {artworkUrl ? (
            <Image src={artworkUrl} alt={title} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
              <Music className="w-4 h-4 text-neutral-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 group-hover/play:bg-black/50 transition-colors flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white drop-shadow" />
            ) : (
              <Play className="w-4 h-4 text-white drop-shadow ml-0.5" />
            )}
          </div>
          {/* Listen progress bar */}
          {isPlaying && !hasListenedEnough && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10">
              <div
                className="h-full bg-purple-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, (listenSeconds / MIN_LISTEN) * 100)}%` }}
              />
            </div>
          )}
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-bold text-black truncate leading-tight">{title}</h3>
            {isPro && <Crown className="w-3 h-3 text-purple-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] text-black/40 truncate">{artistName}</p>
            {displayGenre && (
              <>
                <span className="text-black/15">·</span>
                <span className="text-[10px] text-black/30 truncate">{displayGenre}</span>
              </>
            )}
          </div>
        </div>

        {/* Source label for Bandcamp (no embed) */}
        {sourceType === "BANDCAMP" && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-black/30 hover:text-black transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Bandcamp</span>
          </a>
        )}

        {/* Vote button */}
        <div className="flex-shrink-0 relative">
          <button
            onClick={handleVote}
            disabled={isOwn || isVoting}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition-all duration-150",
              hasVoted
                ? "bg-purple-600 border-purple-600 text-white"
                : isOwn
                ? "bg-neutral-50 border-black/8 text-black/20 cursor-not-allowed"
                : hasListenedEnough
                ? "bg-white border-purple-200 text-purple-600 hover:border-purple-400 hover:bg-purple-50 cursor-pointer"
                : "bg-white border-black/8 text-black/30 hover:border-black/15 cursor-pointer"
            )}
          >
            {showListenHint && !hasListenedEnough ? (
              /* Show countdown inside the button — avoids overflow-hidden clipping */
              <span className="text-[11px] font-black tabular-nums leading-none text-center">
                {MIN_LISTEN - listenSeconds}s
              </span>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 -mb-0.5" />
                <span className="text-[11px] font-black tabular-nums">{votes}</span>
              </>
            )}
          </button>
          {/* +1 credit flash */}
          {showCreditFlash && (
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center gap-0.5 bg-lime-400 text-lime-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200">
                +1 credit
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── INLINE EMBED ─────────────────────────────────────── */}
      {isExpanded && embedUrl && (
        <div className="-mx-4 sm:-mx-5 border-t border-black/5 relative">
          {/* Close button */}
          <button
            onClick={handlePlay}
            className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/10 hover:bg-black/20 transition-colors"
          >
            <X className="w-3 h-3 text-black/50" />
          </button>

          {sourceType === "SOUNDCLOUD" && (
            <iframe
              src={embedUrl}
              height="120"
              width="100%"
              allow="autoplay"
              className="block"
              style={{ border: "none" }}
            />
          )}

          {sourceType === "YOUTUBE" && (
            <div className="relative w-full" style={{ paddingBottom: "52%" }}>
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
