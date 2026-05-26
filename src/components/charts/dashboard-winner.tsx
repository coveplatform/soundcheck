"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Music, Play, Pause, X, ArrowRight } from "lucide-react";

interface WinnerData {
  id: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  artistName: string;
  artistImage: string | null;
  editorNote: string | null;
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
  const [artworkFailed, setArtworkFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimer = useCallback(() => {}, []);

  useEffect(() => {
    fetch("/api/charts")
      .then((res) => res.json())
      .then((data) => {
        if (data.featuredWinner) setWinner(data.featuredWinner);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
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
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
      if (winner.sourceType === "UPLOAD" && winner.sourceUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(winner.sourceUrl);
          audioRef.current.addEventListener("ended", () => setIsPlaying(false));
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
    if (audioRef.current) audioRef.current.pause();
  };

  return (
    <div style={{ backgroundColor: "#2d1b69" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Label */}
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-400">
            Breakthrough · Track of the Day
          </p>
        </div>

        {/* Main card */}
        <div className="flex items-start gap-5 sm:gap-7">

          {/* Artwork */}
          <button
            onClick={handlePlay}
            className="relative flex-shrink-0 rounded-xl overflow-hidden group/play"
            style={{ width: 100, height: 100 }}
          >
            {winner.artworkUrl && !artworkFailed ? (
              <Image
                src={winner.artworkUrl}
                alt={winner.title}
                fill
                className="object-cover"
                sizes="100px"
                onError={() => setArtworkFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d2a8a, #1a0f3d)" }}>
                <Music className="w-8 h-8" style={{ color: "rgba(196,179,247,0.3)" }} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 group-hover/play:bg-black/50 transition-colors flex items-center justify-center">
              {isPlaying
                ? <Pause className="w-7 h-7 text-white drop-shadow-md" />
                : <Play className="w-7 h-7 text-white drop-shadow-md ml-0.5" />
              }
            </div>
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h2
              className="font-black leading-tight mb-1"
              style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", color: "#fff", letterSpacing: "-0.02em" }}
            >
              {winner.title}
            </h2>
            <p className="font-semibold mb-3" style={{ fontSize: 13, color: "rgba(196,179,247,0.6)" }}>
              {winner.artistName}
            </p>
            {winner.editorNote && (
              <p className="hidden sm:block mb-4 leading-relaxed" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 440 }}>
                {winner.editorNote}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-2 font-black uppercase transition-all"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  padding: "8px 18px",
                  borderRadius: 999,
                  backgroundColor: isPlaying ? "rgba(196,179,247,0.2)" : "#c4b3f7",
                  color: isPlaying ? "#c4b3f7" : "#2d1b69",
                  border: isPlaying ? "1px solid rgba(196,179,247,0.3)" : "none",
                }}
              >
                {isPlaying ? <Pause style={{ width: 9, height: 9 }} /> : <Play style={{ width: 9, height: 9 }} />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              {isPlaying && (
                <button
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 font-bold transition-colors"
                  style={{ fontSize: 11, color: "rgba(196,179,247,0.35)", letterSpacing: "0.05em" }}
                >
                  <X style={{ width: 11, height: 11 }} /> Close
                </button>
              )}
              <Link
                href="/breakthrough"
                className="inline-flex items-center gap-1.5 font-bold transition-colors hover:opacity-80"
                style={{ fontSize: 11, color: "rgba(196,179,247,0.45)", letterSpacing: "0.05em" }}
              >
                Full page <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Expanded embed */}
        {isExpanded && embedUrl && (
          <div className="mt-5 rounded-xl overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {winner.sourceType === "SOUNDCLOUD" && (
              <iframe src={embedUrl} height="120" width="100%" allow="autoplay" className="block" style={{ border: "none" }} />
            )}
            {winner.sourceType === "YOUTUBE" && (
              <div className="relative w-full" style={{ paddingBottom: "45%" }}>
                <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ border: "none" }} />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
