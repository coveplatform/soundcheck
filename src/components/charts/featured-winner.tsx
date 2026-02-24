"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, ExternalLink, Share2, X } from "lucide-react";
import { WinnerShareCard } from "@/components/charts/winner-share-card";

interface FeaturedWinnerProps {
  title: string;
  artistName: string;
  artworkUrl: string | null;
  sourceUrl: string;
  voteCount: number;
  artistImage: string | null;
  submissionId?: string;
}

export function FeaturedWinner({
  title,
  artistName,
  artworkUrl,
  sourceUrl,
  voteCount,
  submissionId,
}: FeaturedWinnerProps) {
  const [showShare, setShowShare] = useState(false);
  const [cardData, setCardData] = useState<any>(null);

  useEffect(() => {
    if (!showShare || !submissionId) return;
    fetch(`/api/charts/winner-card?submissionId=${submissionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.card) setCardData(data.card);
      })
      .catch(() => {});
  }, [showShare, submissionId]);

  return (
    <>
      <div className="bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          {/* Label */}
          <div className="flex items-center gap-1.5 mb-4">
            <Music className="w-3 h-3 text-amber-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              Yesterday&apos;s Track of the Day
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Artwork */}
            <div className="flex-shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/10">
              {artworkUrl ? (
                <Image src={artworkUrl} alt={title} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                  <Music className="w-5 h-5 text-neutral-600" />
                </div>
              )}
            </div>

            {/* Title + artist */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-white truncate leading-tight">
                {title}
              </h3>
              <p className="text-sm text-white/40 mt-0.5 truncate">{artistName}</p>
            </div>

            {/* Vote count + actions */}
            <div className="flex-shrink-0 text-right border-l-2 border-white/10 pl-4 sm:pl-5 flex items-center gap-3">
              <div>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums leading-none">
                  {voteCount}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mt-1">
                  votes
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {submissionId && (
                  <button
                    onClick={() => setShowShare(true)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Share winner card"
                  >
                    <Share2 className="w-3.5 h-3.5 text-white/60" />
                  </button>
                )}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Listen"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowShare(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-black">Share Your Win</h2>
              <button
                onClick={() => setShowShare(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4 text-black/40" />
              </button>
            </div>
            {cardData ? (
              <WinnerShareCard
                title={cardData.title}
                artistName={cardData.artistName}
                artworkUrl={cardData.artworkUrl}
                voteCount={cardData.voteCount}
                date={cardData.date}
                shareText={cardData.shareText}
                canShare={cardData.canShare}
                isPro={cardData.isPro}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-[11px] text-black/30">Loading...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
