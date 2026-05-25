"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, ExternalLink, Play } from "lucide-react";

interface Pick {
  id: string;
  title: string;
  artistName: string;
  artistImage: string | null;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  genre: string | null;
  editorNote: string | null;
  editorNoteByline: string | null;
  chartDate: string;
}

interface ChartsData {
  today: Pick | null;
  recent: Pick[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChartsPage() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/charts")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const featured = data?.today ?? data?.recent?.[0] ?? null;
  const recent = data?.today ? data.recent : data?.recent?.slice(1) ?? [];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#f9f7ff" }}>

      {/* ══ HERO IMAGE ══════════════════════════════════════════════ */}
      <div
        className="w-full relative"
        style={{ aspectRatio: "21 / 9", minHeight: "240px", maxHeight: "500px", backgroundColor: "#1a0f3d" }}
      >
        <Image src="/charts-hero.jpg" alt="Track of the Day" fill className="object-cover" />
      </div>

      {/* ══ TODAY'S PICK ══ deep indigo ════════════════════════════ */}
      <div style={{ backgroundColor: "#2d1b69" }}>
        {isLoading ? (
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 flex items-center gap-3">
            <div
              className="animate-spin"
              style={{ width: 20, height: 20, borderRadius: 999, border: "2px solid rgba(196,179,247,0.2)", borderTopColor: "#c4b3f7" }}
            />
            <p style={{ fontSize: "12px", color: "rgba(196,179,247,0.4)", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Loading...
            </p>
          </div>
        ) : featured ? (
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12 sm:py-16">

            {/* Label + date */}
            <p
              style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(196,179,247,0.4)", marginBottom: 32 }}
            >
              Track of the Day &nbsp;·&nbsp; {formatDate(featured.chartDate)}
            </p>

            {/* Main content */}
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-10">

              {/* Artwork */}
              <div
                className="flex-shrink-0 relative self-start"
                style={{ width: 160, height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: "#1a0f3d" }}
              >
                {featured.artworkUrl ? (
                  <Image src={featured.artworkUrl} alt={featured.title} fill className="object-cover" sizes="160px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music style={{ width: 32, height: 32, color: "rgba(196,179,247,0.25)" }} />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                {featured.genre && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "10px",
                      fontWeight: 900,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "#c4b3f7",
                      backgroundColor: "rgba(196,179,247,0.12)",
                      borderRadius: 999,
                      padding: "3px 10px",
                      marginBottom: 12,
                    }}
                  >
                    {featured.genre}
                  </span>
                )}

                <h2
                  className="font-black leading-none"
                  style={{ fontSize: "clamp(1.6rem, 5vw, 2.8rem)", color: "#fff", letterSpacing: "-0.025em", marginBottom: 8 }}
                >
                  {featured.title}
                </h2>

                <p style={{ fontSize: "14px", color: "rgba(196,179,247,0.6)", fontWeight: 600, marginBottom: 20 }}>
                  {featured.artistName}
                </p>

                {/* Editor's note */}
                {featured.editorNote && (
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.75)",
                      fontStyle: "italic",
                      marginBottom: 24,
                      borderLeft: "3px solid rgba(196,179,247,0.3)",
                      paddingLeft: 16,
                    }}
                  >
                    {featured.editorNote}
                  </p>
                )}

                {/* Byline + listen */}
                <div className="flex items-center gap-4 flex-wrap">
                  {featured.editorNoteByline && (
                    <p style={{ fontSize: "11px", color: "rgba(196,179,247,0.35)", fontWeight: 700, letterSpacing: "0.1em" }}>
                      — {featured.editorNoteByline}
                    </p>
                  )}
                  <a
                    href={featured.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-black uppercase transition-all"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.25em",
                      padding: "8px 18px",
                      borderRadius: 999,
                      backgroundColor: "#c4b3f7",
                      color: "#2d1b69",
                    }}
                  >
                    <Play style={{ width: 10, height: 10 }} />
                    Listen
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 text-center">
            <p style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(196,179,247,0.3)", marginBottom: 12 }}>
              Track of the Day
            </p>
            <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "rgba(255,255,255,0.4)" }}>
              No pick yet today
            </p>
            <p style={{ fontSize: "13px", color: "rgba(196,179,247,0.3)", marginTop: 8 }}>
              The best-reviewed track from yesterday&apos;s pipeline gets featured here each morning.
            </p>
          </div>
        )}
      </div>

      {/* ══ RECENT PICKS ══ soft lavender ══════════════════════════ */}
      {recent.length > 0 && (
        <div style={{ backgroundColor: "#ede8ff" }} className="py-12">
          <div className="max-w-3xl mx-auto px-6 sm:px-10">
            <p
              style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "#9d7fd4", marginBottom: 24 }}
            >
              Recent Picks
            </p>

            <div className="space-y-3">
              {recent.map((pick) => (
                <a
                  key={pick.id}
                  href={pick.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group transition-all"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: "14px 16px",
                    border: "1px solid rgba(196,179,247,0.25)",
                    textDecoration: "none",
                  }}
                >
                  {/* Artwork */}
                  <div
                    className="flex-shrink-0 relative overflow-hidden"
                    style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: "#ede8ff" }}
                  >
                    {pick.artworkUrl ? (
                      <Image src={pick.artworkUrl} alt={pick.title} fill className="object-cover" sizes="52px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music style={{ width: 18, height: 18, color: "#c4b3f7" }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-black truncate" style={{ fontSize: "14px", color: "#2d1b69" }}>
                        {pick.title}
                      </p>
                      <p style={{ fontSize: "12px", color: "#9d7fd4", fontWeight: 600, flexShrink: 0 }}>
                        {pick.artistName}
                      </p>
                    </div>
                    {pick.editorNote && (
                      <p
                        className="truncate mt-0.5"
                        style={{ fontSize: "12px", color: "#b8a0e0", fontStyle: "italic" }}
                      >
                        {pick.editorNote}
                      </p>
                    )}
                  </div>

                  {/* Date + icon */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <p style={{ fontSize: "11px", color: "#c4b3f7", fontWeight: 700 }}>
                      {formatDateShort(pick.chartDate)}
                    </p>
                    <ExternalLink
                      style={{ width: 14, height: 14, color: "#d4c3ff", opacity: 0, transition: "opacity 0.15s" }}
                      className="group-hover:opacity-100"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ BOTTOM SPACER ══════════════════════════════════════════ */}
      <div style={{ backgroundColor: "#f9f7ff", paddingBottom: 96 }} />
    </div>
  );
}
