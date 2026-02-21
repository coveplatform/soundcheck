"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight, Headphones, RefreshCw, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparklesDoodle, StarDoodle } from "@/components/dashboard/doodles";

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
      {/* Brand doodles */}
      <SparklesDoodle className="absolute -top-1 -right-1 w-10 h-10 text-lime-600/[0.07] pointer-events-none" />
      <StarDoodle className="absolute bottom-2 right-8 w-8 h-8 text-lime-600/[0.06] pointer-events-none" />

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 text-black/20 hover:text-black/50 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-lime-500 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">We simplified everything</h3>
            <p className="text-sm text-black/50 mt-0.5">
              No more buying credits. Now you <span className="font-semibold text-lime-700">earn them by reviewing</span>.
            </p>
          </div>
        </div>

        {/* The loop — simple and punchy */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 ml-[52px] flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-black/10 text-xs font-bold text-black">
            <Headphones className="h-3 w-3 text-lime-600" />
            Review a track
          </span>
          <ArrowRight className="h-3 w-3 text-lime-500 flex-shrink-0" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-100 border-2 border-lime-200 text-xs font-bold text-lime-800">
            +1 credit
          </span>
          <ArrowRight className="h-3 w-3 text-lime-500 flex-shrink-0" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-black/10 text-xs font-bold text-black">
            Spend on your track
          </span>
        </div>

        {/* Queue slot callout */}
        <div className="rounded-lg bg-white/60 border border-black/5 px-4 py-3 mb-4 ml-[52px]">
          <p className="text-[13px] text-black/70">
            Your track sits in a <span className="font-bold text-black">queue slot</span> while it gets reviews.
            Free = 1 slot. <Link href="/pro" className="font-bold text-purple-600 hover:underline">Pro</Link> = 3 slots + priority.
            {" "}Any tracks already in your queue are safe.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 ml-[52px]">
          <Link href="/review">
            <Button className="bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out text-sm h-9 px-4 rounded-xl">
              <Headphones className="h-3.5 w-3.5 mr-1.5" />
              Start reviewing
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href="/pro" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-semibold">
            <Crown className="h-3.5 w-3.5" />
            What&apos;s Pro?
          </Link>
          <button
            onClick={handleDismiss}
            className="ml-auto text-xs text-black/25 hover:text-black/50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
