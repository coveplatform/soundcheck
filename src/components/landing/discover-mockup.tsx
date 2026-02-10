"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const TRACKS = [
  { title: "Neon Pulse", ArtistProfile: "Maya Kim", genre: "Electronic", color: "from-cyan-500 to-blue-600", Review: 12, artwork: 1 },
  { title: "Golden Hour", ArtistProfile: "James Cole", genre: "Lo-Fi", color: "from-amber-500 to-orange-600", Review: 8, artwork: 2 },
  { title: "Street Lights", ArtistProfile: "DJ Nova", genre: "House", color: "from-pink-500 to-rose-600", Review: 15, artwork: 3 },
  { title: "Echoes", ArtistProfile: "Sarah Moon", genre: "Ambient", color: "from-violet-500 to-purple-600", Review: 6, artwork: 4 },
  { title: "City Rain", ArtistProfile: "Tom West", genre: "Hip-Hop", color: "from-green-500 to-teal-600", Review: 19, artwork: 5 },
  { title: "Drift Away", ArtistProfile: "Luna Park", genre: "Indie", color: "from-red-500 to-pink-600", Review: 11, artwork: 6 },
];

export function DiscoverMockup() {
  const [missingArtwork, setMissingArtwork] = useState<Record<number, boolean>>({});

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-950">Discover</h1>
          <p className="text-sm text-neutral-500">Find tracks to review and share</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-700">
            <option>All Genres</option>
            <option>Electronic</option>
            <option>Hip-Hop</option>
            <option>Lo-Fi</option>
          </select>
        </div>
      </div>

      {/* Track Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {TRACKS.map((track) => (
          <div key={track.title} className="group cursor-pointer">
            {/* Album Art */}
            <div className={`aspect-square rounded-xl bg-gradient-to-br ${track.color} shadow-md relative overflow-hidden`}>
              {!missingArtwork[track.artwork] ? (
                <img
                  src={`/discover-artwork/${track.artwork}.jpg`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                  onError={() => {
                    setMissingArtwork((prev) => ({ ...prev, [track.artwork]: true }));
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Play className="w-5 h-5 text-neutral-900 fill-current ml-0.5" />
                </div>
              </div>
              {/* Review count badge */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-neutral-700">
                {track.Review} reviews
              </div>
            </div>

            {/* Track Info */}
            <div className="mt-2">
              <p className="font-semibold text-neutral-950 text-sm truncate">{track.title}</p>
              <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{track.genre}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
