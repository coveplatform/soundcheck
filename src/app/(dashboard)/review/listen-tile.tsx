"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Music, Loader2, Zap } from "lucide-react";

interface ListenTileProps {
  trackId: string;
  title: string;
  artistName: string;
  artworkUrl: string | null;
  reviewsRemaining: number | null;
  isPriority?: boolean;
}

export function ListenTile({ trackId, title, artistName, artworkUrl, reviewsRemaining, isPriority }: ListenTileProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isLocked = reviewsRemaining !== null && reviewsRemaining <= 0;

  const handleClaim = async () => {
    if (isLocked || loading) return;
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/reviews/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/review/${data.reviewId}/v2`);
      } else {
        setError(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClaim}
      disabled={isLocked || loading}
      className="relative aspect-square overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed w-full"
    >
      {/* Artwork */}
      {artworkUrl ? (
        <Image
          src={artworkUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04] group-disabled:opacity-40"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="w-full h-full bg-[#0f0f18] flex items-center justify-center">
          <Music className="h-8 w-8 text-white/15" />
        </div>
      )}

      {/* Priority badge */}
      {isPriority && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5">
          <Zap className="h-2.5 w-2.5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Priority</span>
        </div>
      )}

      {/* Bottom info — always visible, fades on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pt-8 pb-3 group-hover:opacity-0 transition-opacity duration-200">
        <p className="text-[12px] font-bold text-white leading-tight truncate">{title}</p>
        <p className="text-[10px] text-white/45 truncate mt-0.5">{artistName}</p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 px-4">
        {loading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : error ? (
          <span className="bg-red-500 text-white font-bold text-xs px-4 py-2">Try again</span>
        ) : (
          <>
            <p className="text-sm font-bold text-white text-center leading-snug line-clamp-2">{title}</p>
            <p className="text-[11px] text-white/50 text-center">{artistName}</p>
            <span className="mt-1 bg-white text-black font-black text-[11px] uppercase tracking-wider px-5 py-2">
              Review →
            </span>
          </>
        )}
      </div>

      {/* Locked state */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white/30 text-[10px] font-black uppercase tracking-wider">Daily limit</span>
        </div>
      )}
    </button>
  );
}
