"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight, Lock, Music, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarDoodle } from "@/components/dashboard/doodles";

const STORAGE_KEY = "mixreflect_queue_announcement_dismissed";

export function QueueAnnouncement() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const val = localStorage.getItem(STORAGE_KEY);
    if (!val) setDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative rounded-xl border-2 border-lime-300 bg-gradient-to-br from-lime-50 via-white to-lime-50/30 p-5 sm:p-6 mb-5 overflow-hidden">
      <StarDoodle className="absolute bottom-1 right-6 w-8 h-8 text-lime-600/[0.06] pointer-events-none" />

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 text-black/20 hover:text-black/50 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Title + visual slots in one row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left: title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-black mb-1">New: queue slots</h3>
          <p className="text-[13px] text-black/50">Your tracks wait in slots while they get reviewed.</p>
        </div>

        {/* Right: visual slot squares */}
        <div className="flex items-end gap-2 flex-shrink-0">
          {/* Slot 1 — filled */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-lg bg-lime-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-[9px] font-bold text-black/40">SLOT 1</span>
          </div>
          {/* Slot 2 — locked */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-lg border-2 border-dashed border-black/10 bg-white/50 flex items-center justify-center">
              <Lock className="h-4 w-4 text-black/15" />
            </div>
            <span className="text-[9px] font-bold text-purple-400">PRO</span>
          </div>
          {/* Slot 3 — locked */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-lg border-2 border-dashed border-black/10 bg-white/50 flex items-center justify-center">
              <Lock className="h-4 w-4 text-black/15" />
            </div>
            <span className="text-[9px] font-bold text-purple-400">PRO</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5 mt-4">
        <Link href="/tracks">
          <Button className="bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out text-sm h-9 px-4 rounded-xl">
            See your queue
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
        <Link href="/pro" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-semibold">
          <Crown className="h-3.5 w-3.5" />
          Unlock 3 slots
        </Link>
        <button
          onClick={handleDismiss}
          className="ml-auto text-xs text-black/25 hover:text-black/50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
