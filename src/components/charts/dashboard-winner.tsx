"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Music, ArrowRight } from "lucide-react";

interface WinnerData {
  id: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  artistName: string;
  artistImage: string | null;
  editorNote: string | null;
}

const NOTE_TRUNCATE = 160;

export function DashboardWinner() {
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [artworkFailed, setArtworkFailed] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/charts")
      .then((res) => res.json())
      .then((data) => {
        if (data.featuredWinner) setWinner(data.featuredWinner);
      })
      .catch(() => {});
  }, []);

  if (!winner) return null;

  const note = winner.editorNote ?? "";
  const isTruncatable = note.length > NOTE_TRUNCATE;
  const displayNote = isTruncatable && !noteExpanded ? note.slice(0, NOTE_TRUNCATE).trimEnd() + "…" : note;

  return (
    <div style={{ backgroundColor: "#2d1b69" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Label */}
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-3.5 h-3.5" style={{ color: "#c4b3f7" }} />
          <p className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: "#c4b3f7" }}>
            Breakthrough Track of the Day
          </p>
        </div>

        {/* Main layout */}
        <div className="flex items-start gap-5 sm:gap-7">

          {/* Artwork */}
          <div
            className="relative flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 110, height: 110 }}
          >
            {winner.artworkUrl && !artworkFailed ? (
              <Image
                src={winner.artworkUrl}
                alt={winner.title}
                fill
                className="object-cover"
                sizes="110px"
                onError={() => setArtworkFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d2a8a, #1a0f3d)" }}>
                <Music className="w-8 h-8" style={{ color: "rgba(196,179,247,0.3)" }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2
              className="font-black leading-tight mb-1"
              style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)", color: "#fff", letterSpacing: "-0.025em" }}
            >
              {winner.title}
            </h2>
            <p className="font-semibold mb-3" style={{ fontSize: 13, color: "rgba(196,179,247,0.55)" }}>
              {winner.artistName}
            </p>

            {note && (
              <div className="mb-4">
                <p className="leading-relaxed" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                  {displayNote}
                </p>
                {isTruncatable && (
                  <button
                    onClick={() => setNoteExpanded((v) => !v)}
                    className="mt-1 font-bold transition-opacity hover:opacity-70"
                    style={{ fontSize: 12, color: "#c4b3f7" }}
                  >
                    {noteExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            <Link
              href="/breakthrough"
              className="inline-flex items-center gap-1.5 font-black uppercase transition-opacity hover:opacity-70"
              style={{ fontSize: 10, letterSpacing: "0.2em", color: "#c4b3f7" }}
            >
              See full page <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
