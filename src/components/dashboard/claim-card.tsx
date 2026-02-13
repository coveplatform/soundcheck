"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        className="w-full group flex items-center gap-0 rounded-xl border border-black/8 bg-white overflow-hidden transition-colors duration-150 ease-out hover:bg-white/90 hover:border-black/12 disabled:opacity-70 text-left"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 relative">
          {artworkUrl ? (
            <Image
              src={artworkUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
              <Music className="h-5 w-5 text-neutral-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-3 px-3 sm:px-4">
          <p className="text-sm font-semibold text-black truncate">{title}</p>
          <p className="text-xs text-black/40 truncate">by {artistName}</p>
        </div>
        <div className="flex items-center pr-3 sm:pr-4 flex-shrink-0">
          <span className="inline-flex items-center justify-center rounded-lg bg-purple-600 text-white text-sm font-bold px-3 h-8 pointer-events-none">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                Review
                <ArrowRight className="h-4 w-4 ml-1" />
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
