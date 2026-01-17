"use client";

import { useEffect, useRef, useState } from "react";

interface Activity {
  id: number;
  type: "review" | "sale";
  title: string;
  artist: string;
  timeAgo: string;
  metric: string;
  artwork: number;
  color: string;
}

const ACTIVITIES: Activity[] = [
  { id: 1, type: "review", title: "Neon Pulse", artist: "Maya Kim", timeAgo: "just now", metric: "5 reviews", artwork: 1, color: "bg-gradient-to-br from-purple-500 to-blue-600" },
  { id: 2, type: "sale", title: "Late Night Taxi", artist: "Marcus T.", timeAgo: "1m ago", metric: "$0.50 sale", artwork: 2, color: "bg-gradient-to-br from-orange-500 to-red-600" },
  { id: 3, type: "review", title: "Golden Hour", artist: "James Cole", timeAgo: "2m ago", metric: "8 reviews", artwork: 3, color: "bg-gradient-to-br from-green-500 to-teal-600" },
  { id: 4, type: "review", title: "Street Lights", artist: "DJ Nova", timeAgo: "3m ago", metric: "4 reviews", artwork: 4, color: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { id: 5, type: "sale", title: "City Rain", artist: "Tom West", timeAgo: "5m ago", metric: "$0.50 sale", artwork: 5, color: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { id: 6, type: "review", title: "Echoes", artist: "Sarah Moon", timeAgo: "6m ago", metric: "6 reviews", artwork: 6, color: "bg-gradient-to-br from-violet-500 to-purple-600" },
  { id: 7, type: "review", title: "Drift Away", artist: "Luna Park", timeAgo: "8m ago", metric: "7 reviews", artwork: 7, color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { id: 8, type: "sale", title: "After Hours", artist: "Kira Lane", timeAgo: "10m ago", metric: "$0.50 sale", artwork: 8, color: "bg-gradient-to-br from-lime-500 to-green-600" },
  { id: 9, type: "review", title: "Soft Focus", artist: "Aiden Grey", timeAgo: "12m ago", metric: "9 reviews", artwork: 9, color: "bg-gradient-to-br from-red-500 to-pink-600" },
  { id: 10, type: "review", title: "Static Bloom", artist: "Rae Winter", timeAgo: "14m ago", metric: "3 reviews", artwork: 10, color: "bg-gradient-to-br from-indigo-500 to-violet-600" },
  { id: 11, type: "sale", title: "Low Tide", artist: "Niko Vale", timeAgo: "16m ago", metric: "$0.50 sale", artwork: 11, color: "bg-gradient-to-br from-yellow-500 to-amber-600" },
  { id: 12, type: "review", title: "Night Garden", artist: "Ivy Stone", timeAgo: "18m ago", metric: "6 reviews", artwork: 12, color: "bg-gradient-to-br from-teal-500 to-cyan-600" },
];

export function ActivityFeed() {
  const ARTWORK_COUNT = 36;
  const DEFAULT_ARTWORK_COUNT = 15;

  const getInitialLayout = () => {
    if (typeof window === "undefined") {
      return { visibleCount: 7, cardSizePx: 130, gapPx: 20 };
    }
    const isMobile = window.innerWidth < 640;
    return isMobile
      ? { visibleCount: 3, cardSizePx: 108, gapPx: 14 }
      : { visibleCount: 7, cardSizePx: 130, gapPx: 20 };
  };

  const [layout, setLayout] = useState(getInitialLayout);
  const STEP_PX = layout.cardSizePx + layout.gapPx;
  const VIEWPORT_WIDTH_PX = layout.visibleCount * layout.cardSizePx + (layout.visibleCount - 1) * layout.gapPx;

  const [queue, setQueue] = useState<Activity[]>(() =>
    ACTIVITIES.slice(0, layout.visibleCount).map((activity) => ({ ...activity, artwork: 1 + Math.floor(Math.random() * DEFAULT_ARTWORK_COUNT) }))
  );
  const [nextIndex, setNextIndex] = useState(layout.visibleCount);
  const [renderQueue, setRenderQueue] = useState<Activity[]>(() =>
    ACTIVITIES.slice(0, layout.visibleCount).map((activity) => ({ ...activity, artwork: 1 + Math.floor(Math.random() * DEFAULT_ARTWORK_COUNT) }))
  );
  const [phase, setPhase] = useState<"idle" | "pre" | "sliding">("idle");

  const [artworkExt, setArtworkExt] = useState<Record<number, "jpg" | "png" | "none">>({});

  const pickArtwork = (exclude: number[] = []) => {
    const available = Object.entries(artworkExt)
      .filter(([, ext]) => ext !== "none")
      .map(([key]) => Number(key))
      .filter((n) => Number.isFinite(n) && n >= 1);

    const excludeSet = new Set(exclude);

    if (available.length > 0) {
      const filtered = available.filter((n) => !excludeSet.has(n));
      const pool = filtered.length > 0 ? filtered : available;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const fallbackAvailable = Array.from({ length: DEFAULT_ARTWORK_COUNT }, (_, i) => i + 1);
    const fallbackFiltered = fallbackAvailable.filter((n) => !excludeSet.has(n));
    const pool = fallbackFiltered.length > 0 ? fallbackFiltered : fallbackAvailable;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const queueRef = useRef<Activity[]>(queue);
  const nextIndexRef = useRef(nextIndex);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIncomingRef = useRef<Activity | null>(null);
  const pendingQueueRef = useRef<Activity[]>(queue);

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 640;
      setLayout(isMobile
        ? { visibleCount: 3, cardSizePx: 108, gapPx: 14 }
        : { visibleCount: 7, cardSizePx: 130, gapPx: 20 }
      );
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const used = new Set<number>();
    const reset = ACTIVITIES.slice(0, layout.visibleCount).map((activity) => {
      const artwork = pickArtwork(Array.from(used));
      used.add(artwork);
      return { ...activity, artwork };
    });
    setQueue(reset);
    setRenderQueue(reset);
    setNextIndex(layout.visibleCount);
    nextIndexRef.current = layout.visibleCount;
    queueRef.current = reset;
    pendingQueueRef.current = reset;
    setPhase("idle");
    pendingIncomingRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [layout.visibleCount]);

  useEffect(() => {
    let cancelled = false;

    const preload = (src: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });

    void (async () => {
      for (let i = 1; i <= ARTWORK_COUNT; i++) {
        const jpgOk = await preload(`/activity-artwork/${i}.jpg`);
        if (cancelled) return;
        if (jpgOk) {
          setArtworkExt((prev) => (prev[i] ? prev : { ...prev, [i]: "jpg" }));
          continue;
        }

        const pngOk = await preload(`/activity-artwork/${i}.png`);
        if (cancelled) return;
        if (pngOk) {
          setArtworkExt((prev) => (prev[i] ? prev : { ...prev, [i]: "png" }));
        } else {
          setArtworkExt((prev) => (prev[i] ? prev : { ...prev, [i]: "none" }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ARTWORK_COUNT]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    pendingQueueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    nextIndexRef.current = nextIndex;
  }, [nextIndex]);

  const commitPending = () => {
    if (!pendingIncomingRef.current) return;

    const committed = [pendingIncomingRef.current, ...pendingQueueRef.current].slice(0, layout.visibleCount);
    setQueue(committed);
    setRenderQueue(committed);

    const updatedNextIndex = (nextIndexRef.current + 1) % ACTIVITIES.length;
    nextIndexRef.current = updatedNextIndex;
    setNextIndex(updatedNextIndex);

    setPhase("idle");
    pendingIncomingRef.current = null;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const artworkSrcForIndex = (index: number) => {
    const ext = artworkExt[index] ?? "jpg";
    return `/activity-artwork/${index}.${ext}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const currentQueue = queueRef.current;
      const currentNextIndex = nextIndexRef.current;

      const excludeArtwork = currentQueue.map((a) => a.artwork);
      const incoming = {
        ...ACTIVITIES[currentNextIndex % ACTIVITIES.length],
        id: Date.now(),
        artwork: pickArtwork(excludeArtwork),
      };

      pendingIncomingRef.current = incoming;
      pendingQueueRef.current = currentQueue;

      setRenderQueue([incoming, ...currentQueue]);
      setPhase("pre");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("sliding");
        });
      });

      // Fallback commit only (primary commit is onTransitionEnd).
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        commitPending();
      }, 900);
    }, 3000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const ActivityCard = ({ activity }: { activity: Activity }) => (
    (() => {
      const isCompact = layout.visibleCount < 7;
      const resolvedExt = artworkExt[activity.artwork];
      const shouldRenderArtwork = resolvedExt && resolvedExt !== "none";

      return (
    <button
      type="button"
      className="group cursor-pointer select-none bg-transparent p-0 border-0 focus-visible:outline-none"
    >
      {/* Artwork Square */}
      <div
        className={`${activity.color} shadow-md flex items-center justify-center relative overflow-hidden rounded-2xl transition-all duration-200 ease-out group-hover:shadow-lg group-hover:scale-[1.02] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-lime-300 group-focus-visible:outline-offset-2`}
        style={{ width: `${layout.cardSizePx}px`, height: `${layout.cardSizePx}px` }}
      >
        {shouldRenderArtwork ? (
          <img
            src={artworkSrcForIndex(activity.artwork)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            onError={() => {
              setArtworkExt((prev) => {
                const current = prev[activity.artwork] ?? "jpg";
                if (current === "jpg") return { ...prev, [activity.artwork]: "png" };
                return { ...prev, [activity.artwork]: "none" };
              });
            }}
          />
        ) : null}
        <span className="absolute top-2 right-2 text-[11px] font-semibold bg-white/95 text-neutral-950 px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
          {activity.type === "sale" ? "$0.50" : activity.metric.split(" ")[0]}
        </span>
      </div>

      {/* Text underneath */}
      <div className="mt-3" style={{ width: `${layout.cardSizePx}px` }}>
        <p className={`${isCompact ? "text-[13px]" : "text-sm"} font-semibold text-neutral-950 truncate`}>{activity.title}</p>
        <p className={`${isCompact ? "text-[12px]" : "text-[13px]"} font-semibold text-neutral-700 truncate`}>{activity.artist}</p>
        <p
          className={`${isCompact ? "text-[12px]" : "text-[13px]"} font-semibold leading-tight ${
            activity.type === "sale" ? "text-lime-700" : "text-neutral-700"
          }`}
        >
          {activity.metric}
        </p>
        <p className={`${isCompact ? "text-[11px]" : "text-xs"} text-neutral-500`}>{activity.timeAgo}</p>
      </div>
    </button>
      );
    })()
  );

  return (
    <div className="w-full flex justify-center px-4">
      <div className="relative overflow-hidden" style={{ width: `min(100%, ${VIEWPORT_WIDTH_PX}px)` }}>
        <div
          className={`flex will-change-transform ${
            phase === "sliding"
              ? "transition-transform duration-500 ease-out"
              : "transition-none"
          }`}
          style={{
            gap: `${layout.gapPx}px`,
            transform: `translateX(${phase === "pre" ? -STEP_PX : 0}px)`,
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "transform") return;
            if (phase !== "sliding") return;
            commitPending();
          }}
        >
          {renderQueue.map((activity) => (
            <div key={activity.id} className="flex-shrink-0">
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
