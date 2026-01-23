"use client";

import { useEffect, useState } from "react";

/**
 * Calculates realistic online listener count based on time of day (EST/EDT).
 * The count varies throughout the day to match realistic usage patterns.
 */
function getOnlineListenersCount(): number {
  const now = new Date();

  // Get hour in EST/EDT (UTC-5 or UTC-4)
  // For simplicity, we'll use UTC-5 (EST)
  const utcHour = now.getUTCHours();
  const estHour = (utcHour - 5 + 24) % 24;

  // Define ranges based on time of day (EST)
  // Night hours: 2am-8am (20-40 listeners)
  if (estHour >= 2 && estHour < 8) {
    return Math.floor(Math.random() * 21) + 20; // 20-40
  }

  // Morning: 8am-12pm (60-100 listeners)
  if (estHour >= 8 && estHour < 12) {
    return Math.floor(Math.random() * 41) + 60; // 60-100
  }

  // Afternoon/Peak: 12pm-6pm (80-150 listeners)
  if (estHour >= 12 && estHour < 18) {
    return Math.floor(Math.random() * 71) + 80; // 80-150
  }

  // Evening: 6pm-11pm (50-90 listeners)
  if (estHour >= 18 && estHour < 23) {
    return Math.floor(Math.random() * 41) + 50; // 50-90
  }

  // Late night: 11pm-2am (30-60 listeners)
  return Math.floor(Math.random() * 31) + 30; // 30-60
}

export function OnlineListeners() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // Set initial count
    setCount(getOnlineListenersCount());

    // Update every 30 seconds to keep it feeling dynamic
    const interval = setInterval(() => {
      setCount(getOnlineListenersCount());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until we have a count (avoid hydration mismatch)
  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center gap-2.5 px-5 py-3 bg-purple-50 border-2 border-purple-200 rounded-full shadow-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
        <span className="text-base font-bold text-purple-900">
          {count}+ listeners online now
        </span>
      </div>
    </div>
  );
}
