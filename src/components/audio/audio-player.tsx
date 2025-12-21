"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  sourceUrl: string;
  sourceType: string;
  minListenTime?: number; // seconds required before can submit
  onListenProgress?: (seconds: number) => void;
  onMinimumReached?: () => void;
  showListenTracker?: boolean;
  showWaveform?: boolean;
}

export function AudioPlayer({
  sourceUrl,
  sourceType,
  minListenTime = 90,
  onListenProgress,
  onMinimumReached,
  showListenTracker = true,
  showWaveform = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [totalListenTime, setTotalListenTime] = useState(0);
  const [hasReachedMinimum, setHasReachedMinimum] = useState(false);
  const [waveformPeaks, setWaveformPeaks] = useState<number[] | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // For embedded players (SoundCloud, YouTube)
  const isEmbedded = sourceType === "SOUNDCLOUD" || sourceType === "YOUTUBE";

  // Get embed URL
  const getEmbedUrl = () => {
    if (sourceType === "SOUNDCLOUD") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(sourceUrl)}&color=%23000000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    }
    if (sourceType === "YOUTUBE") {
      const videoId = new URL(sourceUrl).searchParams.get("v") || sourceUrl.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
    return sourceUrl;
  };

  // Track listen time
  useEffect(() => {
    if (!showListenTracker) {
      return;
    }

    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setTotalListenTime((prev) => {
          const newTime = prev + 1;
          onListenProgress?.(newTime);

          if (!hasReachedMinimum && newTime >= minListenTime) {
            setHasReachedMinimum(true);
            onMinimumReached?.();
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [
    isPlaying,
    hasReachedMinimum,
    minListenTime,
    onListenProgress,
    onMinimumReached,
    showListenTracker,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const listenProgress =
    showListenTracker && minListenTime > 0
      ? Math.min((totalListenTime / minListenTime) * 100, 100)
      : 0;

  useEffect(() => {
    if (!showWaveform) {
      setWaveformPeaks(null);
      return;
    }

    if (isEmbedded) {
      setWaveformPeaks(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) {
          return;
        }

        const arrayBuffer = await res.arrayBuffer();

        const AudioContextCtor =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextCtor();

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const channel = audioBuffer.getChannelData(0);

        const bars = 96;
        const blockSize = Math.max(1, Math.floor(channel.length / bars));
        const peaks: number[] = [];

        let max = 0;
        for (let i = 0; i < bars; i++) {
          const start = i * blockSize;
          const end = Math.min(channel.length, start + blockSize);
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += Math.abs(channel[j] ?? 0);
          }
          const value = sum / Math.max(1, end - start);
          peaks.push(value);
          if (value > max) {
            max = value;
          }
        }

        const normalized = max > 0 ? peaks.map((p) => p / max) : peaks.map(() => 0);

        try {
          await ctx.close();
        } catch {
          // ignore
        }

        if (!cancelled) {
          setWaveformPeaks(normalized);
        }
      } catch {
        // ignore
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isEmbedded, showWaveform, sourceUrl]);

  if (isEmbedded) {
    return (
      <div className="space-y-4">
        {/* Embedded Player */}
        <div className="rounded-lg overflow-hidden bg-neutral-900">
          <iframe
            src={getEmbedUrl()}
            width="100%"
            height={sourceType === "YOUTUBE" ? 315 : 166}
            allow="autoplay; encrypted-media"
            className="border-0"
          />
        </div>

        {showListenTracker ? (
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Listen Time</span>
              <span className="text-sm text-neutral-500">
                {formatTime(totalListenTime)} / {formatTime(minListenTime)} required
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  hasReachedMinimum ? "bg-green-500" : "bg-neutral-900"
                )}
                style={{ width: `${listenProgress}%` }}
              />
            </div>
            {hasReachedMinimum ? (
              <p className="text-xs text-green-600 mt-2">
                Minimum listen time reached. You can now submit your review.
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-2">
                Play the track above. Time is tracked automatically.
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setIsPlaying(true)}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                  isPlaying
                    ? "bg-neutral-200 text-neutral-500"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
                )}
              >
                {isPlaying ? "Tracking..." : "Start Tracking"}
              </button>
              {isPlaying && (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="py-2 px-4 rounded-md text-sm font-medium bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                >
                  Pause Tracking
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Native audio player (for direct URLs)
  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        src={sourceUrl}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {showWaveform && waveformPeaks ? (
        <div className="rounded-lg bg-neutral-50 p-3">
          <div className="flex items-end gap-[2px] h-16">
            {waveformPeaks.map((p, idx) => {
              const progress = duration > 0 ? currentTime / duration : 0;
              const isActive = idx / waveformPeaks.length <= progress;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex-1 rounded-sm",
                    isActive ? "bg-neutral-900" : "bg-neutral-200"
                  )}
                  style={{ height: `${Math.max(6, Math.round(p * 100))}%` }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="bg-neutral-50 rounded-lg p-4">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (audioRef.current) {
                if (isPlaying) {
                  audioRef.current.pause();
                } else {
                  audioRef.current.play();
                }
              }
            }}
            className="h-12 w-12 bg-neutral-900 rounded-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 transition-all"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="text-neutral-500 hover:text-neutral-900"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
        </div>

        {showListenTracker ? (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Listen Time</span>
              <span className="text-sm text-neutral-500">
                {formatTime(totalListenTime)} / {formatTime(minListenTime)} required
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  hasReachedMinimum ? "bg-green-500" : "bg-neutral-900"
                )}
                style={{ width: `${listenProgress}%` }}
              />
            </div>
            {hasReachedMinimum && (
              <p className="text-xs text-green-600 mt-2">
                Minimum listen time reached!
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
