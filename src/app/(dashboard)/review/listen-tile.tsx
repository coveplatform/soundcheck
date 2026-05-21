"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Music, Loader2 } from "lucide-react";

interface ListenTileProps {
  trackId: string;
  title: string;
  artistName: string;
  artworkUrl: string | null;
  reviewsRemaining: number | null;
}

export function ListenTile({ trackId, title, artistName, artworkUrl, reviewsRemaining }: ListenTileProps) {
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
      className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed w-full"
    >
      {/* Artwork */}
      {artworkUrl ? (
        <Image
          src={artworkUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06] group-disabled:opacity-40"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
          <Music className="h-8 w-8 text-white/20" />
        </div>
      )}

      {/* Always-on bottom gradient + info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pt-10 pb-3 transition-opacity duration-200 group-hover:opacity-0">
        <p className="text-[11px] font-black text-white leading-tight truncate">{title}</p>
        <p className="text-[10px] text-white/50 truncate mt-0.5">{artistName}</p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="h-7 w-7 text-white animate-spin" />
        ) : error ? (
          <span className="bg-red-500 text-white font-black text-xs px-4 py-2 rounded-full">Try again</span>
        ) : (
          <>
            <p className="text-sm font-black text-white text-center px-4 leading-tight">{title}</p>
            <p className="text-[11px] text-white/60 text-center">{artistName}</p>
            <span className="mt-1 bg-lime-400 text-black font-black text-[11px] uppercase tracking-wider px-5 py-2 rounded-full">
              Review it
            </span>
          </>
        )}
      </div>

      {/* Locked state */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <span className="text-white/40 text-[10px] font-black uppercase tracking-wider">Daily limit</span>
        </div>
      )}
    </button>
  );
}
