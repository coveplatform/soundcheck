"use client";

import { useRef, useCallback, useEffect, useState } from "react";

// ── Types ───────────────────────────────────────────────────────

export interface RawBehaviorEvent {
  type: "PLAY" | "PAUSE" | "SEEK" | "VOLUME" | "MUTE" | "TAB_FOCUS" | "TAB_BLUR";
  ts: number;   // wall-clock timestamp (Date.now())
  pos: number;  // track position in seconds
  meta?: Record<string, unknown>;
}

export interface BehaviorMetrics {
  completionRate: number;       // 0-1: furthest position / track duration
  attentionScore: number;       // 0-1: focused time / total session time
  uniqueSecondsHeard: number;   // distinct seconds of track listened
  replayZones: Array<{ start: number; end: number; count: number }>;
  skipZones: Array<{ from: number; to: number }>;
  pausePoints: Array<{ position: number; durationMs: number }>;
  engagementCurve: number[];    // per-10s bucket engagement scores (0-1)
  firstSkipAt: number | null;   // seconds into track of first forward seek
  totalEvents: number;
}

interface UseListenBehaviorOptions {
  /** Track duration in seconds (0 if unknown) */
  trackDuration: number;
  /** Whether capture is enabled */
  enabled?: boolean;
  /** Callback fired every flush with the batch of events */
  onFlush?: (events: RawBehaviorEvent[]) => void;
}

// ── Hook ────────────────────────────────────────────────────────

export function useListenBehavior({
  trackDuration,
  enabled = true,
  onFlush,
}: UseListenBehaviorOptions) {
  const bufferRef = useRef<RawBehaviorEvent[]>([]);
  const allEventsRef = useRef<RawBehaviorEvent[]>([]);
  const lastPositionRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(0);
  const heardSecondsRef = useRef<Set<number>>(new Set());
  const furthestPositionRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(0);
  const focusedTimeRef = useRef<number>(0);
  const lastFocusRef = useRef<number>(Date.now());
  const isFocusedRef = useRef<boolean>(true);
  const isPlayingRef = useRef<boolean>(false);
  const playStartRef = useRef<number>(0);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [eventCount, setEventCount] = useState(0);

  // Push event into buffer + all-events log
  const pushEvent = useCallback((event: RawBehaviorEvent) => {
    if (!enabled) return;
    bufferRef.current.push(event);
    allEventsRef.current.push(event);
    setEventCount((c) => c + 1);
  }, [enabled]);

  // Flush buffer
  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const batch = [...bufferRef.current];
    bufferRef.current = [];
    onFlush?.(batch);
  }, [onFlush]);

  // Auto-flush every 5 seconds
  useEffect(() => {
    if (!enabled) return;
    flushTimerRef.current = setInterval(flush, 5000);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, [enabled, flush]);

  // Track tab visibility
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        isFocusedRef.current = true;
        lastFocusRef.current = now;
        pushEvent({ type: "TAB_FOCUS", ts: now, pos: lastPositionRef.current });
      } else {
        if (isFocusedRef.current) {
          focusedTimeRef.current += now - lastFocusRef.current;
        }
        isFocusedRef.current = false;
        pushEvent({ type: "TAB_BLUR", ts: now, pos: lastPositionRef.current });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, pushEvent]);

  // Initialize session start
  useEffect(() => {
    if (enabled && sessionStartRef.current === 0) {
      sessionStartRef.current = Date.now();
      lastFocusRef.current = Date.now();
    }
  }, [enabled]);

  // ── Callbacks for the audio player ──

  const onPlay = useCallback((position: number) => {
    isPlayingRef.current = true;
    playStartRef.current = Date.now();
    pushEvent({ type: "PLAY", ts: Date.now(), pos: position });
  }, [pushEvent]);

  const onPause = useCallback((position: number) => {
    isPlayingRef.current = false;
    pushEvent({ type: "PAUSE", ts: Date.now(), pos: position });
  }, [pushEvent]);

  const onTimeUpdate = useCallback((position: number) => {
    const now = Date.now();
    const prev = lastPositionRef.current;

    // Track heard seconds
    const sec = Math.floor(position);
    if (sec >= 0) heardSecondsRef.current.add(sec);

    // Track furthest position
    if (position > furthestPositionRef.current) {
      furthestPositionRef.current = position;
    }

    // Detect seek: position jump > 2 seconds since last update
    const timeSinceLastUpdate = now - lastTimeUpdateRef.current;
    if (timeSinceLastUpdate < 1000 && Math.abs(position - prev) > 2) {
      pushEvent({
        type: "SEEK",
        ts: now,
        pos: position,
        meta: { from: prev, to: position },
      });
    }

    lastPositionRef.current = position;
    lastTimeUpdateRef.current = now;
  }, [pushEvent]);

  const onVolumeChange = useCallback((volume: number, position: number) => {
    pushEvent({
      type: "VOLUME",
      ts: Date.now(),
      pos: position,
      meta: { volume },
    });
  }, [pushEvent]);

  const onMuteToggle = useCallback((muted: boolean, position: number) => {
    pushEvent({
      type: "MUTE",
      ts: Date.now(),
      pos: position,
      meta: { muted },
    });
  }, [pushEvent]);

  // ── Compute metrics from all captured events ──

  const getMetrics = useCallback((): BehaviorMetrics => {
    const events = allEventsRef.current;
    const dur = trackDuration > 0 ? trackDuration : 1;

    // Completion rate
    const completionRate = Math.min(1, furthestPositionRef.current / dur);

    // Attention score
    const totalSession = Date.now() - (sessionStartRef.current || Date.now());
    let focused = focusedTimeRef.current;
    if (isFocusedRef.current) {
      focused += Date.now() - lastFocusRef.current;
    }
    const attentionScore = totalSession > 0 ? Math.min(1, focused / totalSession) : 1;

    // Unique seconds
    const uniqueSecondsHeard = heardSecondsRef.current.size;

    // Seek events (for skip/replay detection)
    const seeks = events.filter((e) => e.type === "SEEK" && e.meta);

    // First skip (forward seek)
    let firstSkipAt: number | null = null;
    for (const s of seeks) {
      const from = (s.meta?.from as number) ?? 0;
      const to = s.pos;
      if (to > from + 2) {
        firstSkipAt = from;
        break;
      }
    }

    // Skip zones (forward seeks)
    const skipZones = seeks
      .filter((s) => {
        const from = (s.meta?.from as number) ?? 0;
        return s.pos > from + 2;
      })
      .map((s) => ({
        from: Math.floor((s.meta?.from as number) ?? 0),
        to: Math.floor(s.pos),
      }));

    // Replay zones: backward seeks (replaying earlier content)
    const replaySeeks = seeks.filter((s) => {
      const from = (s.meta?.from as number) ?? 0;
      return s.pos < from - 2;
    });

    // Group replay seeks into zones
    const replayMap = new Map<string, number>();
    for (const s of replaySeeks) {
      const start = Math.floor(s.pos);
      const end = Math.floor((s.meta?.from as number) ?? s.pos);
      // Bucket into 10-second zones
      const zoneStart = Math.floor(start / 10) * 10;
      const zoneEnd = Math.ceil(end / 10) * 10;
      const key = `${zoneStart}-${zoneEnd}`;
      replayMap.set(key, (replayMap.get(key) ?? 0) + 1);
    }
    const replayZones = Array.from(replayMap.entries()).map(([key, count]) => {
      const [start, end] = key.split("-").map(Number);
      return { start, end, count };
    });

    // Pause points: PAUSE events followed by PLAY with >3s gap
    const pausePoints: Array<{ position: number; durationMs: number }> = [];
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === "PAUSE") {
        // Find next PLAY
        for (let j = i + 1; j < events.length; j++) {
          if (events[j].type === "PLAY") {
            const gap = events[j].ts - events[i].ts;
            if (gap > 3000) {
              pausePoints.push({
                position: Math.floor(events[i].pos),
                durationMs: gap,
              });
            }
            break;
          }
        }
      }
    }

    // Engagement curve: per-10s bucket, how many seconds were heard in that bucket
    const bucketSize = 10;
    const numBuckets = Math.ceil(dur / bucketSize);
    const engagementCurve: number[] = [];
    for (let b = 0; b < numBuckets; b++) {
      const bucketStart = b * bucketSize;
      const bucketEnd = Math.min(bucketStart + bucketSize, dur);
      const bucketRange = bucketEnd - bucketStart;
      let heard = 0;
      for (let s = bucketStart; s < bucketEnd; s++) {
        if (heardSecondsRef.current.has(s)) heard++;
      }
      engagementCurve.push(bucketRange > 0 ? heard / bucketRange : 0);
    }

    return {
      completionRate,
      attentionScore,
      uniqueSecondsHeard,
      replayZones,
      skipZones,
      pausePoints,
      engagementCurve,
      firstSkipAt,
      totalEvents: events.length,
    };
  }, [trackDuration]);

  // Final flush: flush remaining buffer + return all events
  const finalFlush = useCallback(() => {
    flush();
    return allEventsRef.current;
  }, [flush]);

  // Get raw events
  const getRawEvents = useCallback(() => {
    return allEventsRef.current;
  }, []);

  return {
    onPlay,
    onPause,
    onTimeUpdate,
    onVolumeChange,
    onMuteToggle,
    getMetrics,
    finalFlush,
    getRawEvents,
    eventCount,
  };
}
