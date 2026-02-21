"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Zap, Crown, ArrowRight, Headphones, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mixreflect_queue_announcement_dismissed";

export function QueueAnnouncement() {
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

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
    <div className="relative rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 p-5 sm:p-6 mb-5 overflow-hidden">
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 text-black/30 hover:text-black/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-base font-bold text-black">MixReflect has a new system</h3>
      </div>

      <p className="text-sm text-black/60 mb-4 max-w-xl leading-relaxed">
        We&apos;ve simplified how everything works. No more buying credits — earn them by reviewing. Here&apos;s the new flow:
      </p>

      {/* Steps */}
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-black/5">
          <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Headphones className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-black mb-0.5">1. Review tracks</p>
            <p className="text-[11px] text-black/50 leading-snug">Listen to tracks in your genre and give feedback. Each review earns 1 credit.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-black/5">
          <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Music className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-black mb-0.5">2. Submit your track</p>
            <p className="text-[11px] text-black/50 leading-snug">Spend credits to get reviews on your own music. Your track goes into a review queue slot.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-black/5">
          <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Crown className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-black mb-0.5">3. Want more?</p>
            <p className="text-[11px] text-black/50 leading-snug">Free users have 1 queue slot. Pro ($9.99/mo) gives you 3 slots + priority reviews.</p>
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100 mb-4">
        <p className="text-xs text-purple-800 font-medium">
          <span className="font-bold">Queue slots</span> — Free: 1 track in queue at a time. Pro: 3 tracks at once + priority placement.
          Your existing queued tracks are grandfathered in.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/review">
          <Button variant="airyPrimary" className="text-sm h-9 px-4">
            <Headphones className="h-3.5 w-3.5 mr-1.5" />
            Earn credits
          </Button>
        </Link>
        <Link href="/pro" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium">
          <Crown className="h-3.5 w-3.5" />
          Learn about Pro
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={handleDismiss}
          className="ml-auto text-xs text-black/30 hover:text-black/50 transition-colors"
        >
          Got it, dismiss
        </button>
      </div>
    </div>
  );
}
