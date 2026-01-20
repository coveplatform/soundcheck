"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StemData {
  id: string;
  stemUrl: string;
  stemType: string;
  label: string;
  order: number;
}

interface StemPlayerProps {
  trackId: string;
  stems: StemData[];
  minListenTime?: number;
  initialListenTime?: number;
  onListenProgress?: (seconds: number) => void;
  onMinimumReached?: () => void;
  onTimeUpdate?: (seconds: number) => void;
  showListenTracker?: boolean;
  onAddTimestamp?: (seconds: number) => void;
}

interface StemState {
  volume: number; // 0-1
  isMuted: boolean;
  isSoloed: boolean;
}

export function StemPlayer({
  trackId,
  stems,
  minListenTime = 90,
  initialListenTime = 0,
  onListenProgress,
  onMinimumReached,
  onTimeUpdate,
  showListenTracker = false,
  onAddTimestamp,
}: StemPlayerProps) {
  // Audio elements and Web Audio API nodes
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContext = useRef<AudioContext | null>(null);
  const gainNodes = useRef<Map<string, GainNode>>(new Map());
  const sourceNodes = useRef<Map<string, MediaElementAudioSourceNode>>(new Map());

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Mixer state
  const [stemStates, setStemStates] = useState<Map<string, StemState>>(new Map());

  // Listen tracking
  const [totalListenTime, setTotalListenTime] = useState(initialListenTime);
  const [hasReachedMinimum, setHasReachedMinimum] = useState(
    initialListenTime >= minListenTime
  );
  const listenIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio API and audio elements
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create AudioContext
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextCtor();
        audioContext.current = ctx;

        // Initialize stem states
        const initialStates = new Map<string, StemState>();
        stems.forEach((stem) => {
          initialStates.set(stem.id, {
            volume: 1,
            isMuted: false,
            isSoloed: false,
          });
        });
        setStemStates(initialStates);

        // Create audio elements and wire to Web Audio API
        for (const stem of stems) {
          const audio = new Audio(stem.stemUrl);
          audio.preload = "metadata";
          audio.crossOrigin = "anonymous"; // For CORS if needed

          // Create source and gain nodes
          const source = ctx.createMediaElementSource(audio);
          const gain = ctx.createGain();

          // Connect: source → gain → destination
          source.connect(gain);
          gain.connect(ctx.destination);

          audioRefs.current.set(stem.id, audio);
          gainNodes.current.set(stem.id, gain);
          sourceNodes.current.set(stem.id, source);

          // Listen for metadata loaded
          audio.addEventListener("loadedmetadata", () => {
            if (audio.duration && audio.duration > duration) {
              setDuration(Math.floor(audio.duration));
            }
          });

          // Listen for time updates from master stem
          if (stem.order === 0) {
            audio.addEventListener("timeupdate", () => {
              setCurrentTime(Math.floor(audio.currentTime));
              onTimeUpdate?.(Math.floor(audio.currentTime));
            });

            audio.addEventListener("ended", () => {
              handleEnded();
            });
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        setIsLoading(false);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioContext.current?.close();
      if (listenIntervalRef.current) {
        clearInterval(listenIntervalRef.current);
      }
    };
  }, [stems]);

  // Listen tracking interval
  useEffect(() => {
    if (isPlaying) {
      listenIntervalRef.current = setInterval(() => {
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
      if (listenIntervalRef.current) {
        clearInterval(listenIntervalRef.current);
        listenIntervalRef.current = null;
      }
    }

    return () => {
      if (listenIntervalRef.current) {
        clearInterval(listenIntervalRef.current);
      }
    };
  }, [isPlaying, hasReachedMinimum, minListenTime, onListenProgress, onMinimumReached]);

  const handleEnded = () => {
    setIsPlaying(false);
    audioRefs.current.forEach((audio) => audio.pause());
  };

  const togglePlay = async () => {
    if (isLoading) return;

    if (isPlaying) {
      // Pause all stems
      audioRefs.current.forEach((audio) => audio.pause());
      setIsPlaying(false);
    } else {
      // Resume AudioContext if suspended (Safari requirement)
      if (audioContext.current?.state === "suspended") {
        await audioContext.current.resume();
      }

      // Sync all stems to same position, then play
      const masterAudio = audioRefs.current.get(stems[0].id);
      const syncTime = masterAudio?.currentTime || 0;

      const playPromises: Promise<void>[] = [];
      audioRefs.current.forEach((audio) => {
        audio.currentTime = syncTime;
        playPromises.push(audio.play());
      });

      try {
        await Promise.all(playPromises);
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
    }
  };

  const seekTo = (seconds: number) => {
    audioRefs.current.forEach((audio) => {
      audio.currentTime = seconds;
    });
    setCurrentTime(seconds);
  };

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 10));
  };

  const skipForward = () => {
    seekTo(Math.min(duration, currentTime + 10));
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLoading || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.floor(percentage * duration);

    seekTo(newTime);
  };

  // Mixer controls
  const toggleMute = (stemId: string) => {
    const gain = gainNodes.current.get(stemId);
    const state = stemStates.get(stemId);

    if (gain && state) {
      const newMuted = !state.isMuted;
      gain.gain.value = newMuted ? 0 : state.volume;

      setStemStates((prev) => {
        const updated = new Map(prev);
        updated.set(stemId, { ...state, isMuted: newMuted });
        return updated;
      });
    }
  };

  const toggleSolo = (stemId: string) => {
    const state = stemStates.get(stemId);
    if (!state) return;

    const newSoloed = !state.isSoloed;

    setStemStates((prev) => {
      const updated = new Map(prev);

      // Check if any stems will be soloed after this toggle
      const anySoloed = newSoloed || Array.from(prev.entries()).some(
        ([id, st]) => id !== stemId && st.isSoloed
      );

      prev.forEach((st, id) => {
        const gain = gainNodes.current.get(id);
        if (!gain) return;

        if (id === stemId) {
          // Toggle this stem's solo state
          updated.set(id, { ...st, isSoloed: newSoloed });
          gain.gain.value = newSoloed ? st.volume : st.volume;
        } else {
          // Mute other stems if any stem is soloed
          const shouldMute = anySoloed;
          gain.gain.value = shouldMute ? 0 : st.volume;
        }
      });

      return updated;
    });
  };

  const setVolume = (stemId: string, volume: number) => {
    const gain = gainNodes.current.get(stemId);
    const state = stemStates.get(stemId);

    if (gain && state) {
      // Only update actual gain if not muted and not affected by solo
      const anySoloed = Array.from(stemStates.values()).some((s) => s.isSoloed);
      const isAffectedBySolo = anySoloed && !state.isSoloed;

      if (!state.isMuted && !isAffectedBySolo) {
        gain.gain.value = volume;
      }

      setStemStates((prev) => {
        const updated = new Map(prev);
        updated.set(stemId, { ...state, volume });
        return updated;
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStemTypeEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      MASTER: "🎵",
      DRUMS: "🥁",
      BASS: "🎸",
      SYNTHS: "🎹",
      VOCALS: "🎤",
      MELODY: "🎼",
      FX: "✨",
      OTHER: "🎧",
    };
    return emojiMap[type] || "🎧";
  };

  const listenProgress = minListenTime > 0 ? (totalListenTime / minListenTime) * 100 : 100;
  const timeProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Master Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={togglePlay}
          disabled={isLoading}
          size="lg"
          className="flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>

        <Button onClick={skipBackward} variant="outline" size="sm" disabled={isLoading}>
          <SkipBack className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          {/* Timeline */}
          <div
            onClick={handleTimelineClick}
            className="h-2 bg-neutral-200 rounded-full cursor-pointer hover:bg-neutral-300 transition-colors relative overflow-hidden"
          >
            <div
              className="absolute inset-y-0 left-0 bg-black transition-all duration-100"
              style={{ width: `${timeProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-neutral-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <Button onClick={skipForward} variant="outline" size="sm" disabled={isLoading}>
          <SkipForward className="w-4 h-4" />
        </Button>

        {onAddTimestamp && (
          <Button
            onClick={() => onAddTimestamp(currentTime)}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Add Note
          </Button>
        )}
      </div>

      {/* Stem Mixer */}
      <div className="border-2 border-black rounded-lg p-4 bg-white">
        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span>🎛️</span>
          <span>Stem Mixer ({stems.length} stems)</span>
        </h4>

        <div className="space-y-2">
          {stems.map((stem) => {
            const state = stemStates.get(stem.id);
            const anySoloed = Array.from(stemStates.values()).some((s) => s.isSoloed);
            const isAffectedBySolo = anySoloed && !state?.isSoloed;

            return (
              <div
                key={stem.id}
                className={`flex items-center gap-3 p-2 border-2 rounded-lg transition-colors ${
                  isAffectedBySolo
                    ? "border-neutral-300 bg-neutral-50 opacity-60"
                    : state?.isSoloed
                    ? "border-blue-500 bg-blue-50"
                    : state?.isMuted
                    ? "border-neutral-300 bg-neutral-100"
                    : "border-neutral-300 bg-white"
                }`}
              >
                {/* Stem Label */}
                <div className="w-32 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span>{getStemTypeEmoji(stem.stemType)}</span>
                    <span className="text-sm font-bold truncate">{stem.label}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{stem.stemType}</span>
                </div>

                {/* Mute Button */}
                <Button
                  onClick={() => toggleMute(stem.id)}
                  variant={state?.isMuted ? "default" : "outline"}
                  size="sm"
                  className="w-10 h-8 p-0 font-bold"
                  title="Mute"
                >
                  M
                </Button>

                {/* Solo Button */}
                <Button
                  onClick={() => toggleSolo(stem.id)}
                  variant={state?.isSoloed ? "default" : "outline"}
                  size="sm"
                  className="w-10 h-8 p-0 font-bold"
                  title="Solo"
                >
                  S
                </Button>

                {/* Volume Slider */}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(state?.volume || 1) * 100}
                    onChange={(e) =>
                      setVolume(stem.id, parseInt(e.target.value) / 100)
                    }
                    className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                    disabled={isLoading}
                  />
                  <span className="w-12 text-right text-sm font-mono text-neutral-600">
                    {Math.round((state?.volume || 1) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listen Tracker */}
      {showListenTracker && (
        <div className="border-2 border-black rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">🎧 Listen Progress</span>
            <span className="text-sm text-neutral-600">
              {formatTime(totalListenTime)} / {formatTime(minListenTime)}
            </span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hasReachedMinimum ? "bg-lime-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(100, listenProgress)}%` }}
            />
          </div>
          {hasReachedMinimum && (
            <p className="text-xs text-lime-700 mt-1 font-medium">
              ✓ Minimum listen time reached
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-600 mt-2">Loading stems...</p>
        </div>
      )}
    </div>
  );
}
