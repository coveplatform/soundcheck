"use client";

import { useEffect, useRef, useState } from "react";

interface Activity {
  id: number;
  type: "review" | "sale";
  genre: string;
  timeAgo: string;
  metric: string;
  artwork: number;
  color: string;
}

const ACTIVITIES: Activity[] = [
  { id: 1, type: "review", genre: "Electronic", timeAgo: "just now", metric: "5 reviews", artwork: 1, color: "bg-gradient-to-br from-purple-500 to-blue-600" },
  { id: 2, type: "sale", genre: "Hip-Hop", timeAgo: "1m ago", metric: "$0.50 sale", artwork: 2, color: "bg-gradient-to-br from-orange-500 to-red-600" },
  { id: 3, type: "review", genre: "Indie Rock", timeAgo: "2m ago", metric: "8 reviews", artwork: 3, color: "bg-gradient-to-br from-green-500 to-teal-600" },
  { id: 4, type: "review", genre: "Pop", timeAgo: "3m ago", metric: "4 reviews", artwork: 4, color: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { id: 5, type: "sale", genre: "Lo-Fi", timeAgo: "5m ago", metric: "$0.50 sale", artwork: 5, color: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { id: 6, type: "review", genre: "R&B", timeAgo: "6m ago", metric: "6 reviews", artwork: 6, color: "bg-gradient-to-br from-violet-500 to-purple-600" },
  { id: 7, type: "review", genre: "Techno", timeAgo: "8m ago", metric: "7 reviews", artwork: 7, color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { id: 8, type: "sale", genre: "House", timeAgo: "10m ago", metric: "$0.50 sale", artwork: 8, color: "bg-gradient-to-br from-lime-500 to-green-600" },
  { id: 9, type: "review", genre: "Drum & Bass", timeAgo: "12m ago", metric: "9 reviews", artwork: 9, color: "bg-gradient-to-br from-red-500 to-pink-600" },
  { id: 10, type: "review", genre: "Alternative", timeAgo: "14m ago", metric: "3 reviews", artwork: 10, color: "bg-gradient-to-br from-indigo-500 to-violet-600" },
  { id: 11, type: "sale", genre: "Trap", timeAgo: "16m ago", metric: "$0.50 sale", artwork: 11, color: "bg-gradient-to-br from-yellow-500 to-amber-600" },
  { id: 12, type: "review", genre: "Ambient", timeAgo: "18m ago", metric: "6 reviews", artwork: 12, color: "bg-gradient-to-br from-teal-500 to-cyan-600" },
];

export function ActivityFeed() {
  const VISIBLE_COUNT = 7;
  const CARD_SIZE_PX = 130;
  const GAP_PX = 20;
  const STEP_PX = CARD_SIZE_PX + GAP_PX;
  const VIEWPORT_WIDTH_PX = VISIBLE_COUNT * CARD_SIZE_PX + (VISIBLE_COUNT - 1) * GAP_PX;

  const [queue, setQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, VISIBLE_COUNT));
  const [nextIndex, setNextIndex] = useState(VISIBLE_COUNT);
  const [renderQueue, setRenderQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, VISIBLE_COUNT));
  const [phase, setPhase] = useState<"idle" | "pre" | "sliding">("idle");

  const [missingArtwork, setMissingArtwork] = useState<Record<number, boolean>>({});

  const queueRef = useRef<Activity[]>(queue);
  const nextIndexRef = useRef(nextIndex);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIncomingRef = useRef<Activity | null>(null);
  const pendingQueueRef = useRef<Activity[]>(queue);

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

    const committed = [pendingIncomingRef.current, ...pendingQueueRef.current].slice(0, VISIBLE_COUNT);
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

  const artworkSrcForIndex = (index: number) => `/activity-artwork/${index}.jpg`;

  useEffect(() => {
    const interval = setInterval(() => {
      const currentQueue = queueRef.current;
      const currentNextIndex = nextIndexRef.current;
      const incoming = { ...ACTIVITIES[currentNextIndex % ACTIVITIES.length], id: Date.now() };

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
    <button
      type="button"
      className="group cursor-pointer select-none bg-transparent p-0 border-0 focus-visible:outline-none"
    >
      {/* Artwork Square */}
      <div
        className={`w-[130px] h-[130px] ${activity.color} shadow-md flex items-center justify-center relative overflow-hidden rounded-2xl transition-all duration-200 ease-out group-hover:shadow-lg group-hover:scale-[1.02] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-lime-300 group-focus-visible:outline-offset-2`}
      >
        {!missingArtwork[activity.artwork] ? (
          <img
            src={artworkSrcForIndex(activity.artwork)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            onError={() => {
              setMissingArtwork((prev) => ({ ...prev, [activity.artwork]: true }));
            }}
          />
        ) : null}
        <span className="absolute top-2 right-2 text-[11px] font-semibold bg-white/95 text-neutral-950 px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
          {activity.type === "sale" ? "$0.50" : activity.metric.split(" ")[0]}
        </span>
      </div>

      {/* Text underneath */}
      <div className="mt-3 w-[130px]">
        <p className="text-sm font-semibold text-neutral-950 truncate">{activity.genre}</p>
        <p
          className={`text-[13px] font-semibold leading-tight ${
            activity.type === "sale" ? "text-lime-700" : "text-neutral-700"
          }`}
        >
          {activity.metric}
        </p>
        <p className="text-xs text-neutral-500">{activity.timeAgo}</p>
      </div>
    </button>
  );

  return (
    <div className="w-full flex justify-center">
      <div className="relative overflow-hidden" style={{ width: `${VIEWPORT_WIDTH_PX}px` }}>
        <div
          className={`flex gap-5 will-change-transform ${
            phase === "sliding"
              ? "transition-transform duration-500 ease-out"
              : "transition-none"
          }`}
          style={{ transform: `translateX(${phase === "pre" ? -STEP_PX : 0}px)` }}
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
