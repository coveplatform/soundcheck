"use client";

import { Play, Share2, Heart } from "lucide-react";
import { useState } from "react";

export function TrackPageMockup() {
  const [missingArtwork, setMissingArtwork] = useState(false);

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Track Header */}
        <div className="flex gap-6">
          {/* Album Art */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0 shadow-lg relative overflow-hidden">
            {!missingArtwork ? (
              <img
                src="/track-artwork/midnight-drive.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
                onError={() => setMissingArtwork(true)}
              />
            ) : null}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Track</div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-950 mt-1">Midnight Drive</h1>
            <p className="text-neutral-600 mt-1">by Alex Chen</p>

            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 bg-neutral-200 rounded-full text-xs font-medium text-neutral-700">Electronic</span>
              <span className="px-2 py-0.5 bg-neutral-200 rounded-full text-xs font-medium text-neutral-700">Lo-Fi</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button className="flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-black font-semibold px-4 py-2 rounded-full text-sm transition-colors">
                <Play className="w-4 h-4 fill-current" />
                Play
              </button>
              <button className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-4 py-2 rounded-full text-sm transition-colors">
                Buy · $0.50
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-neutral-200 text-sm">
          <div>
            <span className="font-bold text-neutral-950">847</span>
            <span className="text-neutral-500 ml-1">plays</span>
          </div>
          <div>
            <span className="font-bold text-neutral-950">23</span>
            <span className="text-neutral-500 ml-1">reviews</span>
          </div>
          <div>
            <span className="font-bold text-lime-700">$42.50</span>
            <span className="text-neutral-500 ml-1">earned</span>
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-950">Share this track</p>
              <p className="text-sm text-neutral-500">Earn 10% when your fans buy</p>
            </div>
            <button className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium px-4 py-2 rounded-full text-sm transition-colors">
              <Share2 className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
