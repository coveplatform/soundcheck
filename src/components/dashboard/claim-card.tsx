"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2, Music } from "lucide-react";

interface ClaimCardProps {
  trackId: string;
  title: string;
  artistName: string;
  artworkUrl: string | null;
}

export function ClaimCard({ trackId, title, artistName, artworkUrl }: ClaimCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to claim track");
        setLoading(false);
        return;
      }

      router.push(`/reviewer/review/${data.reviewId}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className="w-full group rounded-xl border border-black/8 bg-white overflow-hidden transition-all duration-150 ease-out hover:border-black/12 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:translate-y-0 active:shadow-none disabled:opacity-70 text-left motion-reduce:transition-none motion-reduce:transform-none"
      >
        {/* Square artwork */}
        <div className="relative aspect-square bg-neutral-100">
          {artworkUrl ? (
            <Image
              src={artworkUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-8 w-8 text-neutral-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5">
          <p className="text-xs font-semibold text-black truncate leading-tight">{title}</p>
          <p className="text-[11px] text-black/40 truncate mb-2">by {artistName}</p>
          <span className="inline-flex items-center justify-center w-full rounded-lg bg-purple-600 text-white text-xs font-bold h-7 pointer-events-none">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                Review
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </span>
        </div>
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-1 px-2">{error}</p>
      )}
    </div>
  );
}
