"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Trophy,
  Music,
  Copy,
  Check,
  Twitter,
  Lock,
  Crown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WinnerShareCardProps {
  title: string;
  artistName: string;
  artworkUrl: string | null;
  voteCount: number;
  date: string;
  shareText: string;
  canShare: boolean;
  isPro: boolean;
}

export function WinnerShareCard({
  title,
  artistName,
  artworkUrl,
  voteCount,
  date,
  shareText,
  canShare,
  isPro,
}: WinnerShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.origin + "/charts");
    const text = encodeURIComponent(shareText);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-3">
      {/* ── VISUAL CARD ─────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border-2 border-black/10">

        {/* Top bar — MixReflect brand */}
        <div className="bg-black px-5 py-3 flex items-center justify-between">
          {/* Logo mark — waveform bars */}
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 200 200" className="w-6 h-6 flex-shrink-0" aria-hidden="true">
              <rect x="10" y="10" width="180" height="180" rx="40" ry="40" fill="#9333ea" />
              <g fill="white">
                <rect x="42" y="78" width="16" height="44" rx="3" />
                <rect x="68" y="55" width="16" height="90" rx="3" />
                <rect x="94" y="38" width="16" height="124" rx="3" />
                <rect x="120" y="62" width="16" height="76" rx="3" />
                <rect x="146" y="82" width="16" height="36" rx="3" />
              </g>
            </svg>
            <span className="text-[13px] leading-none">
              <span className="font-extrabold text-white">Mix</span>
              <span className="font-normal text-white/40">Reflect</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
              Track of the Day
            </span>
          </div>
        </div>

        {/* Main artwork + info section */}
        <div className="bg-white">
          <div className="flex">
            {/* Artwork — full height left column */}
            <div className="flex-shrink-0 relative w-32 sm:w-40 aspect-square">
              {artworkUrl ? (
                <Image
                  src={artworkUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                  <Music className="w-8 h-8 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30 mb-2">
                  Winner · {date}
                </p>
                <h3 className="text-lg sm:text-xl font-black text-black leading-tight tracking-tight truncate">
                  {title}
                </h3>
                <p className="text-[13px] text-black/50 mt-1 truncate font-medium">
                  {artistName}
                </p>
              </div>

              {/* Vote count */}
              <div className="flex items-center gap-1.5 mt-4">
                <div className="flex items-center gap-1 bg-purple-600 text-white px-2.5 py-1.5 rounded-lg">
                  <ChevronUp className="w-3 h-3" />
                  <span className="text-[13px] font-black tabular-nums">{voteCount}</span>
                </div>
                <span className="text-[11px] text-black/40 font-medium">
                  {voteCount === 1 ? "vote" : "votes"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom brand strip */}
          <div className="border-t border-black/5 px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20">
              mixreflect.com/charts
            </span>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
              #1
            </span>
          </div>
        </div>
      </div>

      {/* ── SHARE ACTIONS ───────────────────────────────────── */}
      {canShare ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareTwitter}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-[11px] font-black hover:bg-neutral-800 transition-colors"
          >
            <Twitter className="w-3.5 h-3.5" />
            Share on X
          </button>
          <button
            onClick={handleCopyText}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border-2",
              copied
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-white border-black/10 text-black/60 hover:border-black/20"
            )}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy text
              </>
            )}
          </button>
        </div>
      ) : !isPro ? (
        <Link
          href="/pro"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[11px] font-black text-purple-700">
            Upgrade to Pro to share your winner card
          </span>
          <Crown className="w-3.5 h-3.5 text-purple-400" />
        </Link>
      ) : null}
    </div>
  );
}
