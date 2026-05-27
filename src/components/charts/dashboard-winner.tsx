"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music } from "lucide-react";

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

const NOTE_TRUNCATE = 180;

export function DashboardWinner({ compact = false }: { compact?: boolean }) {
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
  const displayNote = isTruncatable && !noteExpanded
    ? note.slice(0, NOTE_TRUNCATE).trimEnd() + "…"
    : note;

  if (compact) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-3">Track of the Day</p>
        <Link
          href="/breakthrough"
          className="flex items-center gap-4 rounded-2xl p-4 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#2d1b69" }}
        >
          <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
            {winner.artworkUrl && !artworkFailed ? (
              <Image src={winner.artworkUrl} alt={winner.title} fill className="object-cover" sizes="56px" onError={() => setArtworkFailed(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d2a8a, #1a0f3d)" }}>
                <Music className="w-5 h-5" style={{ color: "rgba(196,179,247,0.25)" }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base leading-tight truncate">{winner.title}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(196,179,247,0.5)" }}>{winner.artistName}</p>
          </div>
          <span className="flex-shrink-0 bg-purple-500 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg whitespace-nowrap">
            Listen Now
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#2d1b69" }}>

      {/* Content — padded */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-5 sm:pb-7">

        {/* Overline */}
        <p
          className="mb-3 sm:mb-6"
          style={{ fontSize: 13, color: "rgba(196,179,247,0.7)", fontWeight: 800, letterSpacing: "-0.01em" }}
        >
          Breakthrough Track of the Day
        </p>

        {/* Content row */}
        <div className="flex items-start gap-4 sm:gap-8">

          {/* Artwork */}
          <div
            className="relative flex-shrink-0 rounded-lg overflow-hidden w-20 h-20 sm:w-[140px] sm:h-[140px]"
          >
            {winner.artworkUrl && !artworkFailed ? (
              <Image
                src={winner.artworkUrl}
                alt={winner.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 140px"
                onError={() => setArtworkFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d2a8a, #1a0f3d)" }}>
                <Music className="w-10 h-10" style={{ color: "rgba(196,179,247,0.25)" }} />
              </div>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h2
              className="font-black leading-[1.05] mb-1 sm:mb-2"
              style={{ fontSize: "clamp(1.1rem, 4vw, 2.1rem)", color: "#fff", letterSpacing: "-0.03em" }}
            >
              {winner.title}
            </h2>
            <p
              className="mb-1 sm:mb-4"
              style={{ fontSize: 13, color: "rgba(196,179,247,0.5)", fontWeight: 600 }}
            >
              {winner.artistName}
            </p>

            {note && (
              <div className="hidden sm:block">
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                  {displayNote}
                </p>
                {isTruncatable && (
                  <button
                    onClick={() => setNoteExpanded((v) => !v)}
                    className="mt-1.5 font-semibold transition-opacity hover:opacity-60"
                    style={{ fontSize: 12, color: "#c4b3f7" }}
                  >
                    {noteExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA — full-bleed solid rectangle */}
      <Link
        href="/breakthrough"
        className="block text-center font-black transition-opacity hover:opacity-90 active:opacity-75"
        style={{
          backgroundColor: "#c4b3f7",
          color: "#1a0f3d",
          fontSize: 15,
          letterSpacing: "0.03em",
          padding: "16px 24px",
        }}
      >
        See full page
      </Link>

    </div>
  );
}
