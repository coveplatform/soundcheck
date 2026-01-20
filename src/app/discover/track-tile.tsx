"use client";

import Image from "next/image";
import { Music } from "lucide-react";
import { useState } from "react";

type TrackTileProps = {
  trackId: string | null; // null for demo tiles
  title: string;
  artistName: string;
  artworkUrl: string | null;
  sourceUrl: string;
  isDemo: boolean;
};

export function TrackTile({
  trackId,
  title,
  artistName,
  artworkUrl,
  sourceUrl,
  isDemo,
}: TrackTileProps) {
  const [isTracking, setIsTracking] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // For real tracks (not demos), track the view
    if (!isDemo && trackId) {
      e.preventDefault();

      // Fire-and-forget view tracking (don't block navigation)
      if (!isTracking) {
        setIsTracking(true);
        fetch(`/api/tracks/${trackId}/view`, {
          method: "POST",
        }).catch((err) => {
          console.error("Failed to track view:", err);
        });
      }

      // Navigate to sourceUrl
      window.open(sourceUrl, "_blank", "noopener,noreferrer");
    }
    // For demo tiles, let default behavior (navigate to /signup) happen
  };

  return (
    <a
      href={isDemo ? "/signup" : sourceUrl}
      target={isDemo ? undefined : "_blank"}
      rel={isDemo ? undefined : "noopener noreferrer"}
      onClick={handleClick}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        {artworkUrl ? (
          <Image
            src={artworkUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <Music className="h-10 w-10 text-black/20" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-150 ease-out motion-reduce:transition-none" />
      </div>

      <div className="mt-2 min-w-0">
        <p className="text-sm font-medium text-black truncate group-hover:text-black/70 transition-colors duration-150 ease-out motion-reduce:transition-none">
          {title}
        </p>
        <p className="text-xs text-black/45 truncate">{artistName}</p>
      </div>
    </a>
  );
}
