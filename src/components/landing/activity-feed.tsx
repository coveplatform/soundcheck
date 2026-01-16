"use client";

import { useEffect, useState, useRef } from "react";

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
  const [queue, setQueue] = useState<Activity[]>(() => ACTIVITIES.slice(0, 6));
  const [nextIndex, setNextIndex] = useState(6);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setQueue((prev) => {
          const newItem = ACTIVITIES[nextIndex % ACTIVITIES.length];
          // Add new item to start, remove last item
          return [{ ...newItem, id: Date.now() }, ...prev.slice(0, -1)];
        });
        setNextIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsAnimating(false);
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, [nextIndex]);

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
        ref={containerRef}
        className="relative overflow-hidden"
      >
        <div
          className={`flex justify-center gap-3 transition-transform duration-400 ease-out ${
            isAnimating ? "translate-x-[calc(80px+0.75rem)]" : "translate-x-0"
          }`}
        >
          {queue.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex-shrink-0 transition-all duration-400 ${
                isAnimating && index === 0
                  ? "opacity-0 scale-90 -translate-x-4"
                  : isAnimating && index === queue.length - 1
                  ? "opacity-0 scale-90"
                  : "opacity-100 scale-100"
              }`}
              style={{
                transitionDelay: isAnimating ? `${index * 30}ms` : "0ms",
              }}
            >
              {/* Artwork Square */}
              <div
                className={`w-20 h-20 ${activity.color} border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative overflow-hidden`}
              >
                {/* Abstract pattern overlay */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/40 rounded-full" />
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white/20" />
                </div>
                {activity.type === "sale" && (
                  <span className="absolute top-1 right-1 text-[10px] font-black bg-lime-400 text-black px-1 border border-black">
                    SOLD
                  </span>
                )}
              </div>

              {/* Text underneath */}
              <div className="mt-2 text-center w-20">
                <p className="text-xs font-bold text-white truncate">{activity.genre}</p>
                <p className="text-[10px] text-neutral-500">
                  {activity.type === "sale" ? "$0.50" : "reviewed"} · {activity.timeAgo}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
