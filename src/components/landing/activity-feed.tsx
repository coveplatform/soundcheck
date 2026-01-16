"use client";

import { useEffect, useRef, useState } from "react";

interface Activity {
  id: number;
  type: "review" | "sale";
  genre: string;
  timeAgo: string;
  color: string;
}

const ACTIVITIES: Activity[] = [
  { id: 1, type: "review", genre: "Electronic", timeAgo: "just now", color: "bg-gradient-to-br from-purple-500 to-blue-600" },
  { id: 2, type: "sale", genre: "Hip-Hop", timeAgo: "1m ago", color: "bg-gradient-to-br from-orange-500 to-red-600" },
  { id: 3, type: "review", genre: "Indie Rock", timeAgo: "2m ago", color: "bg-gradient-to-br from-green-500 to-teal-600" },
  { id: 4, type: "review", genre: "Pop", timeAgo: "3m ago", color: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { id: 5, type: "sale", genre: "Lo-Fi", timeAgo: "5m ago", color: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { id: 6, type: "review", genre: "R&B", timeAgo: "6m ago", color: "bg-gradient-to-br from-violet-500 to-purple-600" },
  { id: 7, type: "review", genre: "Techno", timeAgo: "8m ago", color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { id: 8, type: "sale", genre: "House", timeAgo: "10m ago", color: "bg-gradient-to-br from-lime-500 to-green-600" },
  { id: 9, type: "review", genre: "Drum & Bass", timeAgo: "12m ago", color: "bg-gradient-to-br from-red-500 to-pink-600" },
  { id: 10, type: "review", genre: "Alternative", timeAgo: "14m ago", color: "bg-gradient-to-br from-indigo-500 to-violet-600" },
  { id: 11, type: "sale", genre: "Trap", timeAgo: "16m ago", color: "bg-gradient-to-br from-yellow-500 to-amber-600" },
  { id: 12, type: "review", genre: "Ambient", timeAgo: "18m ago", color: "bg-gradient-to-br from-teal-500 to-cyan-600" },
];

export function ActivityFeed() {
  const VISIBLE_COUNT = 9;
  const CARD_SIZE_PX = 72;
  const GAP_PX = 12;
  const STEP_PX = CARD_SIZE_PX + GAP_PX;

  const [queue, setQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, VISIBLE_COUNT));
  const [nextIndex, setNextIndex] = useState(VISIBLE_COUNT);
  const [renderQueue, setRenderQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, VISIBLE_COUNT));
  const [phase, setPhase] = useState<"idle" | "pre" | "sliding">("idle");

  const queueRef = useRef<Activity[]>(queue);
  const nextIndexRef = useRef(nextIndex);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    nextIndexRef.current = nextIndex;
  }, [nextIndex]);

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
        className={`w-[72px] h-[72px] ${activity.color} border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative overflow-hidden transition-all duration-150 ease-out group-hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:brightness-110 group-active:shadow-none group-active:translate-x-[3px] group-active:translate-y-[3px] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-lime-400 group-focus-visible:outline-offset-2`}
      >
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border-2 border-white/40 rounded-full" />
          <div className="absolute top-0 right-0 w-6 h-6 bg-white/20" />
        </div>
        {activity.type === "sale" && (
          <span className="absolute top-1 right-1 text-[8px] font-black bg-lime-400 text-black px-1 border border-black">
            SOLD
          </span>
        )}
      </div>

      {/* Text underneath */}
      <div className="mt-1.5 text-center w-[72px] transition-transform duration-150 group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
        <p className="text-[11px] font-bold text-white truncate group-hover:text-lime-400 transition-colors">{activity.genre}</p>
        <p className="text-[9px] text-neutral-500">
          {activity.type === "sale" ? "$0.50" : "reviewed"} · {activity.timeAgo}
        </p>
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
                    ? "opacity-0 scale-95"
                    : phase === "sliding" && index === renderQueue.length - 1
                    ? "opacity-0 scale-95 translate-x-8"
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
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
