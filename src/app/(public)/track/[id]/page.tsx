"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Music, ExternalLink, Eye } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatViewCount } from "@/lib/utils";

type PublicTrack = {
  id: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  viewCount: number;
  isPublic: boolean;
  artist: {
    artistName: string;
  };
  genres: Array<{
    id: string;
    name: string;
  }>;
};

export default function PublicTrackPage() {
  const params = useParams();
  const trackId = params.id as string;

  const [track, setTrack] = useState<PublicTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrackAndTrackView() {
      try {
        // Fetch track data
        const res = await fetch(`/api/tracks/${trackId}/public`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Track not found");
          } else if (res.status === 403) {
            setError("This track is not public");
          } else {
            setError("Failed to load track");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTrack(data);
        setLoading(false);

        // Track view (fire and forget)
        fetch(`/api/tracks/${trackId}/view`, {
          method: "POST",
        }).catch((err) => {
          console.error("Failed to track view:", err);
        });
      } catch (err) {
        console.error("Error loading track:", err);
        setError("Failed to load track");
        setLoading(false);
      }
    }

    loadTrackAndTrackView();
  }, [trackId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
          <p className="mt-4 text-sm text-black/60">Loading track...</p>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <Card variant="soft" elevated className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold text-black">{error || "Track not found"}</h2>
            <p className="mt-2 text-sm text-black/60">
              {error === "This track is not public"
                ? "This track is private and only accessible to the artist and assigned reviewers."
                : "The track you're looking for doesn't exist or has been removed."}
            </p>
            <div className="mt-6">
              <Link href="/discover">
                <Button variant="airyPrimary">Browse public tracks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950">
      <header className="border-b border-black/10 bg-[#faf8f5]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <Link href="/discover">
              <Button variant="airy" size="sm">
                Discover more
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Artwork */}
          <div className="w-full sm:w-48 sm:h-48 h-64 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex-shrink-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-20 h-20 text-white/30" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
              Track
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black mt-2 break-words">
              {track.title}
            </h1>
            <p className="text-lg text-black/60 mt-2">{track.artist.artistName}</p>

            {/* Genre Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {track.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm font-bold text-black"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* View Count */}
            {track.viewCount > 0 && (
              <div className="flex items-center gap-2 mt-4 text-sm text-black/50">
                <Eye className="h-4 w-4" />
                <span className="font-mono">{formatViewCount(track.viewCount)} views</span>
              </div>
            )}

            {/* Listen Button */}
            <div className="mt-6">
              <a
                href={track.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button className="bg-purple-500 hover:bg-purple-400 text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Listen now
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* About Section */}
        <Card variant="soft" elevated className="mt-12">
          <CardContent className="pt-6">
            <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
              About
            </p>
            <p className="mt-3 text-sm text-black/70">
              This track is hosted on{" "}
              <span className="font-bold capitalize">{track.sourceType.toLowerCase()}</span>. Click
              "Listen now" to play the full track.
            </p>
            <p className="mt-3 text-xs text-black/50">
              Want feedback on your music?{" "}
              <Link href="/get-feedback" className="underline font-medium">
                Get started
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
