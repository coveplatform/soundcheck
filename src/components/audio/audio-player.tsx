"use client";

import { useState, useRef, useEffect, useId, type MouseEvent as ReactMouseEvent } from "react";
import { Play, Pause, Volume2, VolumeX, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// SoundCloud Widget API types
interface SoundCloudWidget {
  bind: (event: string, callback: () => void) => void;
  unbind: (event: string) => void;
  getPosition: (callback: (position: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  pause: () => void;
  seekTo: (milliseconds: number) => void;
}

interface SoundCloudWidgetAPI {
  (iframe: HTMLIFrameElement): SoundCloudWidget;
  Events: {
    PLAY: string;
    PAUSE: string;
    FINISH: string;
  };
}

interface YouTubePlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
}

declare global {
  interface Window {
    SC?: { Widget: SoundCloudWidgetAPI };
    YT?: {
      Player: new (
        elementId: string,
        config: {
          events: {
            onStateChange?: (event: { data: number }) => void;
            onReady?: () => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface AudioPlayerProps {
  sourceUrl: string;
  sourceType: string;
  minListenTime?: number; // seconds required before can submit
  initialListenTime?: number; // restored listen time from draft/server
  onListenProgress?: (seconds: number) => void;
  onMinimumReached?: () => void;
  onTimeUpdate?: (seconds: number) => void;
  showListenTracker?: boolean;
  showWaveform?: boolean;
  onAddTimestamp?: (seconds: number) => void; // callback for adding timestamps at current time
}

export function AudioPlayer({
  sourceUrl,
  sourceType,
  minListenTime = 90,
  initialListenTime = 0,
  onListenProgress,
  onMinimumReached,
  onTimeUpdate,
  showListenTracker = true,
  showWaveform = false,
  onAddTimestamp,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [totalListenTime, setTotalListenTime] = useState(initialListenTime);
  const [hasReachedMinimum, setHasReachedMinimum] = useState(initialListenTime >= minListenTime);
  const [waveformPeaks, setWaveformPeaks] = useState<number[] | null>(null);
  const [isWaveformLoading, setIsWaveformLoading] = useState(false);
  const [timestampAdded, setTimestampAdded] = useState(false);
  const [bandcampEmbedUrl, setBandcampEmbedUrl] = useState<string | null>(null);
  const [bandcampError, setBandcampError] = useState(false);
  const [isEmbedInteractive, setIsEmbedInteractive] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const embedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement | null>(null);
  const scWidgetRef = useRef<SoundCloudWidget | null>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const ytContainerId = useId();
  const bcIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerReady = useRef(false);

  // Store callbacks in refs to avoid effect dependency issues
  const onListenProgressRef = useRef(onListenProgress);
  const onMinimumReachedRef = useRef(onMinimumReached);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  // Keep refs in sync with props
  useEffect(() => {
    onListenProgressRef.current = onListenProgress;
  }, [onListenProgress]);

  useEffect(() => {
    onMinimumReachedRef.current = onMinimumReached;
  }, [onMinimumReached]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // Sync initialListenTime when it changes (e.g., after draft restore)
  // Only update if the new value is greater to avoid resetting progress
  useEffect(() => {
    if (initialListenTime > 0 && initialListenTime > totalListenTime) {
      setTotalListenTime(initialListenTime);
      if (initialListenTime >= minListenTime && !hasReachedMinimum) {
        setHasReachedMinimum(true);
      }
    }
  }, [initialListenTime, minListenTime]);

  const seekToRatio = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const nextTime = Math.max(0, Math.min(1, ratio)) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    onTimeUpdate?.(nextTime);
  };

  const seekFromClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = rect.width > 0 ? x / rect.width : 0;
    seekToRatio(ratio);
  };

  // For embedded players (SoundCloud, YouTube, Bandcamp)
  const isEmbedded = sourceType === "SOUNDCLOUD" || sourceType === "YOUTUBE" || sourceType === "BANDCAMP";

  // On touch devices, embedded iframes can capture touch gestures and make the page feel like it won't scroll.
  // Default to non-interactive embeds and let the user tap to enable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch =
      "ontouchstart" in window ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
    const isCoarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (isTouch || isCoarsePointer) {
      setIsEmbedInteractive(false);
    }
  }, []);

  // Fetch Bandcamp embed URL via oEmbed
  useEffect(() => {
    if (sourceType !== "BANDCAMP") return;

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const fetchBandcampEmbed = async () => {
      try {
        // Set a 10-second timeout
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);

        const oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`;
        const response = await fetch(oembedUrl, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (response.ok && !cancelled) {
          const data = await response.json();
          // Extract src URL from the HTML string
          // Format: <iframe ... src="https://bandcamp.com/EmbeddedPlayer/..." ...></iframe>
          const srcMatch = data.html?.match(/src="([^"]+)"/);
          if (srcMatch?.[1]) {
            setBandcampEmbedUrl(srcMatch[1]);
            setBandcampError(false);
          } else {
            // oEmbed succeeded but no src found
            if (!cancelled) setBandcampError(true);
          }
        } else {
          if (!cancelled) setBandcampError(true);
        }
      } catch (error) {
        // Fetch failed (timeout, network error, etc.)
        if (!cancelled) {
          setBandcampError(true);
        }
      }
    };

    void fetchBandcampEmbed();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [sourceType, sourceUrl]);

  // Get embed URL
  const getEmbedUrl = () => {
    if (sourceType === "SOUNDCLOUD") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(sourceUrl)}&color=%23000000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    }
    if (sourceType === "YOUTUBE") {
      const url = new URL(sourceUrl);
      let videoId = url.searchParams.get("v");
      if (!videoId) {
        // Handle youtu.be URLs: extract path without query params
        const pathPart = url.pathname.split("/").pop() || "";
        videoId = pathPart;
      }
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
    if (sourceType === "BANDCAMP") {
      return bandcampEmbedUrl || "";
    }
    return sourceUrl;
  };

  // Track listen time - use refs for callbacks to prevent interval restarts
  useEffect(() => {
    if (!showListenTracker) {
      return;
    }

    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setTotalListenTime((prev) => prev + 1);
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
  }, [isPlaying, minListenTime, showListenTracker]);

  // Handle callbacks when totalListenTime changes (separate from state update to avoid React warning)
  useEffect(() => {
    if (!showListenTracker || totalListenTime === 0) return;

    onListenProgressRef.current?.(totalListenTime);

    if (totalListenTime >= minListenTime && !hasReachedMinimum) {
      setHasReachedMinimum(true);
      onMinimumReachedRef.current?.();
    }
  }, [totalListenTime, minListenTime, hasReachedMinimum, showListenTracker]);

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
      setIsWaveformLoading(false);
      return;
    }

    if (isEmbedded) {
      setWaveformPeaks(null);
      setIsWaveformLoading(false);
      return;
    }

    let cancelled = false;

    setWaveformPeaks(null);
    setIsWaveformLoading(true);

    const run = async () => {
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) {
          if (!cancelled) {
            setIsWaveformLoading(false);
          }
          return;
        }

        const arrayBuffer = await res.arrayBuffer();

        const AudioContextCtor =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextCtor();

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const bars = 192;
        const length = audioBuffer.length;
        const blockSize = Math.max(1, Math.floor(length / bars));

        const channelCount = Math.max(1, audioBuffer.numberOfChannels);
        const channels: Float32Array[] = [];
        for (let c = 0; c < channelCount; c++) {
          channels.push(audioBuffer.getChannelData(c));
        }

        const peaks: number[] = [];
        let max = 0;

        for (let i = 0; i < bars; i++) {
          const start = i * blockSize;
          const end = Math.min(length, start + blockSize);

          let peak = 0;
          let sumSquares = 0;
          let count = 0;

          for (let j = start; j < end; j++) {
            let sample = 0;
            for (let c = 0; c < channelCount; c++) {
              sample += channels[c]?.[j] ?? 0;
            }
            sample = sample / channelCount;

            const abs = Math.abs(sample);
            if (abs > peak) peak = abs;
            sumSquares += sample * sample;
            count += 1;
          }

          const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
          const value = peak * 0.65 + rms * 0.35;
          peaks.push(value);
          if (value > max) max = value;
        }

        const smoothed = peaks.map((_, i) => {
          const a = peaks[i - 1] ?? peaks[i] ?? 0;
          const b = peaks[i] ?? 0;
          const c = peaks[i + 1] ?? peaks[i] ?? 0;
          return a * 0.25 + b * 0.5 + c * 0.25;
        });

        const normalized = max > 0 ? smoothed.map((p) => Math.min(1, p / max)) : smoothed.map(() => 0);

        try {
          await ctx.close();
        } catch {
          // ignore
        }

        if (!cancelled) {
          setWaveformPeaks(normalized);
          setIsWaveformLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsWaveformLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isEmbedded, showWaveform, sourceUrl]);

  // SoundCloud Widget API integration - auto-detect play/pause
  useEffect(() => {
    if (sourceType !== "SOUNDCLOUD" || !showListenTracker) return;

    let mounted = true;

    const initWidget = () => {
      const iframe = scIframeRef.current;
      if (!iframe || !window.SC?.Widget) return;

      const widget = window.SC.Widget(iframe);
      scWidgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.PLAY, () => {
        if (mounted) setIsPlaying(true);
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        if (mounted) setIsPlaying(false);
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        if (mounted) {
          setIsPlaying(false);
          // Pause the widget to prevent auto-advancing to the next track
          widget.pause();
        }
      });
    };

    // Load SoundCloud Widget API if not already loaded
    if (window.SC?.Widget) {
      // Small delay to ensure iframe is ready
      const timer = setTimeout(initWidget, 500);
      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    }

    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => {
      // Small delay to ensure iframe is ready
      setTimeout(initWidget, 500);
    };
    document.body.appendChild(script);

    return () => {
      mounted = false;
    };
  }, [sourceType, showListenTracker, sourceUrl]);

  // YouTube IFrame API integration - auto-detect play/pause
  useEffect(() => {
    if (sourceType !== "YOUTUBE" || !showListenTracker) return;

    let mounted = true;
    ytPlayerReady.current = false;

    const initPlayer = () => {
      if (!window.YT?.Player || !mounted) return;

      try {
        const player = new window.YT.Player(ytContainerId, {
          events: {
            onReady: () => {
              if (!mounted) return;
              ytPlayerReady.current = true;
              // Check initial state in case video is already playing
              try {
                const state = player.getPlayerState();
                if (state === 1) {
                  setIsPlaying(true);
                }
              } catch {
                // Player might not be fully ready yet
              }
            },
            onStateChange: (event: { data: number }) => {
              if (!mounted) return;
              // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2 || event.data === 0) {
                setIsPlaying(false);
              }
            },
          },
        });
        ytPlayerRef.current = player;
      } catch {
        // Player initialization can fail if iframe not ready
      }
    };

    // Load YouTube IFrame API if not already loaded
    if (window.YT?.Player) {
      const timer = setTimeout(initPlayer, 500);
      return () => {
        mounted = false;
        clearTimeout(timer);
        ytPlayerReady.current = false;
        try {
          ytPlayerRef.current?.destroy();
        } catch {
          // Ignore destroy errors
        }
      };
    }

    // Set up callback for when API is ready
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existingCallback?.();
      setTimeout(initPlayer, 500);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      mounted = false;
      ytPlayerReady.current = false;
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        // Ignore destroy errors
      }
    };
  }, [sourceType, showListenTracker, sourceUrl]);

  // Poll current time for embedded players to enable timestamps
  useEffect(() => {
    if (!isEmbedded || !isPlaying) {
      if (embedTimeIntervalRef.current) {
        clearInterval(embedTimeIntervalRef.current);
        embedTimeIntervalRef.current = null;
      }
      return;
    }

    embedTimeIntervalRef.current = setInterval(() => {
      if (sourceType === "SOUNDCLOUD" && scWidgetRef.current) {
        scWidgetRef.current.getPosition((positionMs) => {
          const seconds = Math.floor(positionMs / 1000);
          setCurrentTime(seconds);
          onTimeUpdateRef.current?.(seconds);
        });
        scWidgetRef.current.getDuration((durationMs) => {
          setDuration(Math.floor(durationMs / 1000));
        });
      } else if (sourceType === "YOUTUBE" && ytPlayerRef.current && ytPlayerReady.current) {
        try {
          const currentSeconds = ytPlayerRef.current.getCurrentTime();
          const totalDuration = ytPlayerRef.current.getDuration();
          if (typeof currentSeconds === "number" && !isNaN(currentSeconds)) {
            const seconds = Math.floor(currentSeconds);
            setCurrentTime(seconds);
            onTimeUpdateRef.current?.(seconds);
          }
          if (typeof totalDuration === "number" && !isNaN(totalDuration) && totalDuration > 0) {
            setDuration(Math.floor(totalDuration));
          }
        } catch {
          // Player may not be ready yet
        }
      }
    }, 500);

    return () => {
      if (embedTimeIntervalRef.current) {
        clearInterval(embedTimeIntervalRef.current);
        embedTimeIntervalRef.current = null;
      }
    };
  }, [isEmbedded, isPlaying, sourceType]);

  if (isEmbedded) {
    const showEnableOverlay =
      !isEmbedInteractive &&
      (sourceType === "SOUNDCLOUD" ||
        sourceType === "YOUTUBE" ||
        (sourceType === "BANDCAMP" && !!bandcampEmbedUrl));

    return (
      <div className="space-y-4">
        {/* Embedded Player */}
        <div className="relative rounded-xl overflow-hidden bg-neutral-950 border border-black/10">
          {sourceType === "SOUNDCLOUD" ? (
            <iframe
              ref={scIframeRef}
              src={getEmbedUrl()}
              width="100%"
              height={166}
              allow="autoplay; encrypted-media"
              className={cn("border-0", !isEmbedInteractive && "pointer-events-none")}
            />
          ) : sourceType === "YOUTUBE" ? (
            <iframe
              id={ytContainerId}
              src={getEmbedUrl()}
              width="100%"
              height={315}
              allow="autoplay; encrypted-media"
              className={cn("border-0", !isEmbedInteractive && "pointer-events-none")}
            />
          ) : sourceType === "BANDCAMP" ? (
            bandcampError ? (
              <div className="h-[120px] flex flex-col items-center justify-center gap-3 text-neutral-400 px-4">
                <p className="text-sm text-center">Could not load Bandcamp player</p>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-lime-500 text-black border border-lime-400 rounded-lg font-bold text-sm hover:bg-lime-400 transition-colors"
                >
                  Open on Bandcamp
                </a>
              </div>
            ) : bandcampEmbedUrl ? (
              <iframe
                ref={bcIframeRef}
                src={bandcampEmbedUrl}
                width="100%"
                height={120}
                allow="autoplay; encrypted-media"
                className={cn("border-0", !isEmbedInteractive && "pointer-events-none")}
                style={{ border: 0 }}
                seamless
              />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-neutral-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading Bandcamp player...
              </div>
            )
          ) : null}

          {showEnableOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button
                type="button"
                onClick={() => setIsEmbedInteractive(true)}
                className="inline-flex items-center gap-2 px-4 py-3 bg-lime-500 text-black border border-lime-400 rounded-xl font-black text-sm shadow-lg"
              >
                <Play className="h-4 w-4" />
                Tap to enable player
              </button>
            </div>
          )}
        </div>

        {/* Manual tracking toggle for Bandcamp (no JS API available) */}
        {sourceType === "BANDCAMP" && showListenTracker && !bandcampError && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 mb-1">Manual Tracking Required</p>
                <p className="text-xs text-amber-700">
                  Bandcamp doesn&apos;t support automatic tracking. Follow these steps:
                </p>
                <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Press <strong>play</strong> on the Bandcamp player above</li>
                  <li>Click <strong>&quot;Start Tracking&quot;</strong> below while listening</li>
                  <li>When you pause the player, click <strong>&quot;Pause Tracking&quot;</strong></li>
                </ol>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-lg border-2 transition-all duration-150 ease-out motion-reduce:transition-none",
                isPlaying
                  ? "bg-black text-white border-black hover:bg-neutral-800"
                  : "bg-lime-500 text-black border-lime-400 hover:bg-lime-400 shadow-md hover:shadow-lg"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pause Tracking
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Start Tracking
                </>
              )}
            </button>
          </div>
        )}

        {/* Helper for Bandcamp errors with listen tracking */}
        {sourceType === "BANDCAMP" && bandcampError && showListenTracker && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-red-900 mb-2">Player could not load</p>
            <p className="text-xs text-red-700 mb-3">
              The Bandcamp embed failed to load. Please open the track in Bandcamp and listen there.
              You can still manually track your listen time here to unlock submission.
            </p>
            <div className="flex gap-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-bold text-sm hover:bg-neutral-50 transition-colors"
              >
                Open on Bandcamp
              </a>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border-2 transition-colors duration-150 ease-out",
                  isPlaying
                    ? "bg-black text-white border-black"
                    : "bg-lime-500 text-black border-lime-400 hover:bg-lime-400"
                )}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Current time and timestamp button for embedded players */}
        {onAddTimestamp && sourceType !== "BANDCAMP" && (
          <div className="bg-white border border-black/10 rounded-2xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono text-neutral-600">
                <span>Current: {formatTime(currentTime)}</span>
                {duration > 0 && (
                  <>
                    <span className="text-neutral-300">/</span>
                    <span>{formatTime(duration)}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddTimestamp(currentTime);
                  setTimestampAdded(true);
                  setTimeout(() => setTimestampAdded(false), 1500);
                }}
                disabled={!isPlaying && currentTime === 0}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors duration-150 ease-out motion-reduce:transition-none",
                  timestampAdded
                    ? "bg-lime-500 text-black border-lime-400 scale-105"
                    : !isPlaying && currentTime === 0
                    ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                    : "bg-white text-black border-black/10 hover:bg-neutral-50"
                )}
              >
                {timestampAdded ? (
                  <>
                    <Check className="h-3 w-3" />
                    Added!
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Add timestamp
                  </>
                )}
              </button>
            </div>
            {!isPlaying && currentTime === 0 && (
              <p className="text-xs text-neutral-400 mt-2">
                Start playing to enable timestamps
              </p>
            )}
          </div>
        )}

        {showListenTracker ? (
          <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Listen Progress</span>
              <span className="text-sm font-mono text-neutral-500">
                {formatTime(totalListenTime)} / {formatTime(minListenTime)}
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
              <div
                className={cn(
                  "h-full transition-[width] duration-300 ease-out rounded-full motion-reduce:transition-none",
                  hasReachedMinimum
                    ? "bg-gradient-to-r from-lime-400 to-lime-500"
                    : "bg-gradient-to-r from-neutral-700 to-neutral-800"
                )}
                style={{ width: `${listenProgress}%` }}
              />
            </div>
            {hasReachedMinimum ? (
              <p className="text-xs font-medium text-lime-600 mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-lime-500" />
                Ready to submit your review
              </p>
            ) : isPlaying ? (
              <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-black animate-pulse" />
                Tracking... keep listening
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-2">
                Press play above to start tracking
              </p>
            )}
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
            const t = audioRef.current.currentTime;
            setCurrentTime(t);
            onTimeUpdate?.(t);
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

      {showWaveform ? (
        <div className="rounded-xl bg-neutral-950 p-4 overflow-hidden">
          {isWaveformLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating waveform...
              </div>
              <div className="grid items-center gap-[2px] h-24 animate-pulse" style={{ gridTemplateColumns: "repeat(48, minmax(0, 1fr))" }}>
                {Array.from({ length: 48 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-full bg-neutral-800"
                    style={{ height: `${8 + (idx % 9) * 6}px` }}
                  />
                ))}
              </div>
            </div>
          ) : waveformPeaks ? (
            <>
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-800/50 pointer-events-none" />

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-10 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                  style={{ left: `${Math.min(100, Math.max(0, (duration > 0 ? (currentTime / duration) * 100 : 0)))}%` }}
                />

                <div
                  className="grid items-center gap-[2px] h-24 cursor-pointer"
                  style={{
                    gridTemplateColumns: `repeat(${waveformPeaks.length}, minmax(0, 1fr))`,
                  }}
                  onClick={seekFromClick}
                  role="slider"
                  aria-label="Seek audio"
                  aria-valuenow={currentTime}
                  aria-valuemin={0}
                  aria-valuemax={duration}
                >
                  {waveformPeaks.map((p, idx) => {
                    const progress = duration > 0 ? currentTime / duration : 0;
                    const barPosition = idx / waveformPeaks.length;
                    const isActive = barPosition <= progress;
                    const pxHeight = Math.max(4, Math.round(4 + p * 80));

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-full transition-colors duration-150",
                          isActive
                            ? "bg-gradient-to-t from-rose-400 to-rose-300"
                            : "bg-neutral-700 hover:bg-neutral-600"
                        )}
                        style={{ height: `${pxHeight}px` }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs font-mono text-neutral-500">
                <span>{formatTime(currentTime)}</span>
                {onAddTimestamp && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddTimestamp(Math.floor(currentTime));
                      setTimestampAdded(true);
                      setTimeout(() => setTimestampAdded(false), 1500);
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg border transition-colors duration-150 ease-out motion-reduce:transition-none",
                      timestampAdded
                        ? "bg-lime-500 text-black border-lime-400 scale-105"
                        : "bg-white text-black border-black/10 hover:bg-neutral-50"
                    )}
                  >
                    {timestampAdded ? (
                      <>
                        <Check className="h-3 w-3" />
                        Added!
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Add timestamp ({formatTime(currentTime)})
                      </>
                    )}
                  </button>
                )}
                <span>{formatTime(duration)}</span>
              </div>
            </>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs font-mono text-neutral-500">
              Waveform unavailable
            </div>
          )}
        </div>
      ) : null}

      <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
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
            className="h-14 w-14 bg-black rounded-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors transition-transform duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </button>

          <div className="flex-1">
            {!showWaveform && (
              <div className="flex items-center gap-2 text-sm font-mono text-neutral-500 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span className="text-neutral-300">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            )}
            <div
              className="h-3 bg-neutral-100 rounded-full overflow-hidden cursor-pointer border border-neutral-200 hover:border-neutral-300 transition-colors"
              onClick={seekFromClick}
              role="slider"
              aria-label="Seek audio"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
            >
              <div
                className="h-full bg-gradient-to-r from-neutral-800 to-neutral-900 transition-[width] duration-100 ease-out rounded-full motion-reduce:transition-none"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>
            {showWaveform && (
              <p className="text-xs text-neutral-400 mt-2">
                Click waveform or bar to seek
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-150 ease-out motion-reduce:transition-none",
              isMuted
                ? "bg-neutral-200 text-neutral-500"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            )}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
        </div>

        {showListenTracker ? (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Listen Progress</span>
              <span className="text-sm font-mono text-neutral-500">
                {formatTime(totalListenTime)} / {formatTime(minListenTime)}
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
              <div
                className={cn(
                  "h-full transition-[width] duration-300 ease-out rounded-full motion-reduce:transition-none",
                  hasReachedMinimum
                    ? "bg-gradient-to-r from-lime-400 to-lime-500"
                    : "bg-gradient-to-r from-neutral-700 to-neutral-800"
                )}
                style={{ width: `${listenProgress}%` }}
              />
            </div>
            {hasReachedMinimum ? (
              <p className="text-xs font-medium text-lime-600 mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-lime-500" />
                Ready to submit your review
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-2">
                Keep listening to unlock submission
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
