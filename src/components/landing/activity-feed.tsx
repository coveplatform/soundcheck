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
  const VISIBLE_COUNT = 9;
  const CARD_SIZE_PX = 84;
  const GAP_PX = 12;
  const STEP_PX = CARD_SIZE_PX + GAP_PX;

  const [queue, setQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, VISIBLE_COUNT));
  const [nextIndex, setNextIndex] = useState(VISIBLE_COUNT);
  const [renderQueue, setRenderQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, VISIBLE_COUNT));
  const [phase, setPhase] = useState<"idle" | "pre" | "sliding">("idle");

  const [missingArtwork, setMissingArtwork] = useState<Record<number, "png" | "both">>({});

  const queueRef = useRef<Activity[]>(queue);
  const nextIndexRef = useRef(nextIndex);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    nextIndexRef.current = nextIndex;
  }, [nextIndex]);

  const artworkSrcForIndex = (index: number) => `/activity-artwork/${index}.png`;
  const artworkJpgSrcForIndex = (index: number) => `/activity-artwork/${index}.jpg`;

  useEffect(() => {
    const interval = setInterval(() => {
      const currentQueue = queueRef.current;
      const currentNextIndex = nextIndexRef.current;
      const incoming = { ...ACTIVITIES[currentNextIndex % ACTIVITIES.length], id: Date.now() };

      setRenderQueue([incoming, ...currentQueue]);
      setPhase("pre");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("sliding");
        });
      });

      // After the slide, commit state: keep the new item, drop the far-right item.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const committed = [incoming, ...currentQueue].slice(0, VISIBLE_COUNT);
        setQueue(committed);
        setRenderQueue(committed);
        const updatedNextIndex = (currentNextIndex + 1) % ACTIVITIES.length;
        nextIndexRef.current = updatedNextIndex;
        setNextIndex(updatedNextIndex);
        setPhase("idle");
      }, 520);
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
        className={`w-[84px] h-[84px] ${activity.color} border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative overflow-hidden transition-all duration-150 ease-out group-hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:brightness-110 group-active:shadow-none group-active:translate-x-[3px] group-active:translate-y-[3px] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-lime-400 group-focus-visible:outline-offset-2`}
      >
        {missingArtwork[activity.artwork] !== "both" ? (
          <img
            src={
              missingArtwork[activity.artwork] === "png"
                ? artworkJpgSrcForIndex(activity.artwork)
                : artworkSrcForIndex(activity.artwork)
            }
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            onError={() => {
              setMissingArtwork((prev) => {
                const current = prev[activity.artwork];
                if (current === "png") {
                  return { ...prev, [activity.artwork]: "both" };
                }
                return { ...prev, [activity.artwork]: "png" };
              });
            }}
          />
        ) : null}
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/40 rounded-full" />
          <div className="absolute top-0 right-0 w-7 h-7 bg-white/20" />
        </div>
        <span className="absolute top-1 right-1 text-[8px] font-black bg-white text-black px-1 border border-black">
          {activity.type === "sale" ? "$0.50" : activity.metric.split(" ")[0]}
        </span>
      </div>

      {/* Text underneath */}
      <div className="mt-2 text-center w-[84px] transition-transform duration-150 group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
        <p className="text-[12px] font-bold text-white truncate group-hover:text-lime-400 transition-colors">{activity.genre}</p>
        <p className="text-[11px] font-black text-lime-400 leading-tight">{activity.metric}</p>
        <p className="text-[10px] text-neutral-400">{activity.timeAgo}</p>
      </div>
    </button>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
        </span>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Selling now</span>
      </div>

      <div
        className="relative overflow-hidden py-1"
      >
        <div className="flex justify-center">
          <div
            className={`flex gap-3 will-change-transform ${
              phase === "sliding"
                ? "transition-transform duration-500 ease-out"
                : "transition-none"
            }`}
            style={{ transform: `translateX(${phase === "pre" ? -STEP_PX : 0}px)` }}
          >
            {renderQueue.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex-shrink-0 transition-all duration-500 ease-out ${
                  phase === "pre" && renderQueue.length > VISIBLE_COUNT && index === 0
                    ? "opacity-0 scale-90 -translate-x-2 -translate-y-3"
                    : phase === "sliding" && renderQueue.length > VISIBLE_COUNT && index === 0
                    ? "opacity-100 scale-100 translate-x-0 translate-y-0"
                    : phase === "sliding" && index === renderQueue.length - 1
                    ? "opacity-100 scale-100 translate-x-24"
                    : "opacity-100 scale-100"
                }`}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </div>

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black via-black/90 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
