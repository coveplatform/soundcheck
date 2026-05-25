"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Music, Upload, CheckCircle, AlertCircle } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(13, 7, 41, 0.85)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md overflow-hidden"
        style={{
          backgroundColor: "#2d1b69",
          borderRadius: "24px 24px 0 0",
          ...(typeof window !== "undefined" && window.innerWidth >= 640
            ? { borderRadius: "20px" }
            : {}),
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 pt-6 pb-5"
          style={{ borderBottom: "1px solid rgba(196,179,247,0.15)" }}
        >
          <div>
            <p
              className="font-black uppercase mb-1"
              style={{ fontSize: "10px", letterSpacing: "0.35em", color: "rgba(196,179,247,0.45)" }}
            >
              Today&apos;s Chart
            </p>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: "1.5rem", color: "#fff", letterSpacing: "-0.02em" }}
            >
              Drop your track.
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <X style={{ width: 16, height: 16, color: "rgba(196,179,247,0.6)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5" style={{ maxHeight: "55vh", overflowY: "auto" }}>
          {success ? (
            <div className="text-center py-10">
              <div
                className="flex items-center justify-center mx-auto mb-4"
                style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: "rgba(74,222,128,0.15)" }}
              >
                <CheckCircle style={{ width: 28, height: 28, color: "#4ade80" }} />
              </div>
              <h3 className="font-black" style={{ fontSize: "1.1rem", color: "#fff" }}>You&apos;re in.</h3>
              <p style={{ fontSize: "13px", color: "rgba(196,179,247,0.6)", marginTop: 6 }}>
                Share it to get votes.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-10">
              <div
                className="mx-auto mb-3 animate-spin"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "2px solid rgba(196,179,247,0.2)",
                  borderTopColor: "#c4b3f7",
                }}
              />
              <p style={{ fontSize: "12px", color: "rgba(196,179,247,0.4)" }}>Loading your tracks...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-10">
              <div
                className="flex items-center justify-center mx-auto mb-4"
                style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                <Upload style={{ width: 22, height: 22, color: "rgba(196,179,247,0.4)" }} />
              </div>
              <h3 className="font-black" style={{ fontSize: "1rem", color: "#fff" }}>No tracks yet</h3>
              <p style={{ fontSize: "12px", color: "rgba(196,179,247,0.45)", marginTop: 6 }}>
                Upload a track first, then come back to enter.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => {
                const isSelected = selectedTrackId === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className="w-full flex items-center gap-3 text-left transition-all"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      backgroundColor: isSelected ? "rgba(196,179,247,0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isSelected ? "rgba(196,179,247,0.4)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div
                      className="relative flex-shrink-0 overflow-hidden"
                      style={{ width: 44, height: 44, borderRadius: 10 }}
                    >
                      {track.artworkUrl ? (
                        <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="44px" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(196,179,247,0.1)" }}
                        >
                          <Music style={{ width: 18, height: 18, color: "rgba(196,179,247,0.4)" }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black truncate" style={{ fontSize: "13px", color: "#fff" }}>
                        {track.title}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle style={{ width: 18, height: 18, color: "#c4b3f7", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-2 mt-4 p-3"
              style={{
                backgroundColor: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 10,
              }}
            >
              <AlertCircle style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: "12px", color: "#f87171" }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && tracks.length > 0 && (
          <div
            className="px-6 pb-6 pt-4"
            style={{ borderTop: "1px solid rgba(196,179,247,0.1)" }}
          >
            <button
              onClick={handleSubmit}
              disabled={!selectedTrackId || isSubmitting}
              className="w-full font-black uppercase transition-all"
              style={{
                fontSize: "11px",
                letterSpacing: "0.25em",
                padding: "14px 24px",
                borderRadius: 12,
                backgroundColor: selectedTrackId && !isSubmitting ? "#c4b3f7" : "rgba(255,255,255,0.1)",
                color: selectedTrackId && !isSubmitting ? "#2d1b69" : "rgba(255,255,255,0.3)",
                cursor: selectedTrackId && !isSubmitting ? "pointer" : "not-allowed",
              }}
            >
              {isSubmitting ? "Submitting..." : "Enter Today's Chart"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
