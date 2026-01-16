"use client";

import { useEffect, useState } from "react";
import { Music, DollarSign } from "lucide-react";

interface Activity {
  id: number;
  type: "review" | "sale";
  genre: string;
  timeAgo: string;
}

const ACTIVITIES: Activity[] = [
  { id: 1, type: "review", genre: "Electronic", timeAgo: "2 min ago" },
  { id: 2, type: "sale", genre: "Hip-Hop", timeAgo: "5 min ago" },
  { id: 3, type: "review", genre: "Indie Rock", timeAgo: "8 min ago" },
  { id: 4, type: "review", genre: "Pop", timeAgo: "12 min ago" },
  { id: 5, type: "sale", genre: "Electronic", timeAgo: "15 min ago" },
  { id: 6, type: "review", genre: "R&B", timeAgo: "18 min ago" },
  { id: 7, type: "review", genre: "Techno", timeAgo: "22 min ago" },
  { id: 8, type: "sale", genre: "Lo-Fi", timeAgo: "25 min ago" },
  { id: 9, type: "review", genre: "Drum & Bass", timeAgo: "28 min ago" },
  { id: 10, type: "review", genre: "Alternative", timeAgo: "32 min ago" },
  { id: 11, type: "sale", genre: "House", timeAgo: "35 min ago" },
  { id: 12, type: "review", genre: "Trap", timeAgo: "38 min ago" },
];

export function ActivityFeed() {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setVisibleIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Show 3 items at a time
  const getVisibleItems = () => {
    const items: Activity[] = [];
    for (let i = 0; i < 3; i++) {
      const index = (visibleIndex + i) % ACTIVITIES.length;
      items.push(ACTIVITIES[index]);
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
        </span>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Live Activity</span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/80 backdrop-blur">
        <div
          className={`divide-y divide-neutral-800 transition-all duration-300 ${
            isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {visibleItems.map((activity, index) => (
            <div
              key={`${activity.id}-${index}`}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className={`h-7 w-7 rounded flex items-center justify-center flex-shrink-0 ${
                activity.type === "sale"
                  ? "bg-lime-500/20 text-lime-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}>
                {activity.type === "sale" ? (
                  <DollarSign className="h-3.5 w-3.5" />
                ) : (
                  <Music className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200 truncate">
                  <span className="font-medium text-white">{activity.genre}</span>
                  {activity.type === "sale" ? (
                    <span> track sold for <span className="text-lime-400 font-bold">$0.50</span></span>
                  ) : (
                    <span> track reviewed</span>
                  )}
                </p>
              </div>
              <span className="text-xs text-neutral-500 flex-shrink-0">{activity.timeAgo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
