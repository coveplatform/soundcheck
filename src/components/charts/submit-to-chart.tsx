"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Music, Upload, CheckCircle, AlertCircle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  status: string;
}

interface SubmitToChartProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function SubmitToChart({ isOpen, onClose, onSubmitted }: SubmitToChartProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    setSelectedTrackId(null);
    fetchTracks();
  }, [isOpen]);

  const fetchTracks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/charts/my-tracks");
      if (!res.ok) throw new Error("Failed to fetch tracks");
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch {
      setError("Failed to load your tracks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTrackId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/charts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: selectedTrackId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 bg-gradient-to-r from-purple-50 to-amber-50">
          <div>
            <h2 className="text-lg font-black text-black">Submit to Chart</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pick a track to enter today&apos;s daily chart
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-black text-black">Submitted!</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Your track is now on today&apos;s chart. Share it to get votes!
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Loading your tracks...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-600">No tracks yet</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Submit a track first, then enter the chart.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left",
                    selectedTrackId === track.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-transparent bg-neutral-50 hover:bg-neutral-100"
                  )}
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    {track.artworkUrl ? (
                      <Image
                        src={track.artworkUrl}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <Music className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">
                      {track.title}
                    </p>
                  </div>
                  {selectedTrackId === track.id && (
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && tracks.length > 0 && (
          <div className="px-5 py-4 border-t border-black/10 bg-neutral-50">
            <Button
              onClick={handleSubmit}
              disabled={!selectedTrackId || isSubmitting}
              isLoading={isSubmitting}
              className="w-full bg-black text-white hover:bg-neutral-800 font-black h-11 rounded-xl border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,0.2)] hover:shadow-[1px_1px_0_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Submit to Today&apos;s Chart
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
