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
      <style>{`
        .listen-btn {
          transition: transform 0.13s ease, box-shadow 0.13s ease, background-color 0.13s ease;
        }
        .listen-btn:hover {
          background-color: #d4c7ff !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(196,179,247,0.45);
        }
        .listen-btn:active {
          transform: translateY(0px);
          box-shadow: none;
        }
        .recent-pick {
          transition: transform 0.13s ease, box-shadow 0.13s ease, border-color 0.13s ease;
          cursor: pointer;
        }
        .recent-pick:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(139,92,246,0.12);
          border-color: rgba(196,179,247,0.55) !important;
        }
        .recent-pick:active {
          transform: translateY(-1px);
        }
        .artwork-wrap {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .artwork-wrap:hover {
          transform: scale(1.015);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        }
      `}</style>

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
          <>
            {/* Label + date — above the split */}
            <div className="max-w-4xl mx-auto px-6 sm:px-10 pt-10 pb-6">
              <p
                style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(196,179,247,0.4)" }}
              >
                Track of the Day &nbsp;·&nbsp; {formatDate(featured.chartDate)}
              </p>
            </div>

            {/* True 50/50 split — equal height both sides */}
            <div
              className="max-w-4xl mx-auto px-6 sm:px-10 pb-12"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: 400 }}
            >
              {/* LEFT — artwork fills full column height */}
              <div
                className="artwork-wrap relative hidden sm:block"
                style={{ borderRadius: "20px 0 0 20px", overflow: "hidden", backgroundColor: "#1a0f3d" }}
              >
                {featured.artworkUrl ? (
                  <Image src={featured.artworkUrl} alt={featured.title} fill className="object-cover" sizes="50vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music style={{ width: 48, height: 48, color: "rgba(196,179,247,0.2)" }} />
                  </div>
                )}
              </div>

              {/* Mobile-only artwork (stacked) */}
              <div
                className="relative w-full sm:hidden col-span-2"
                style={{ aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden", backgroundColor: "#1a0f3d", marginBottom: 24 }}
              >
                {featured.artworkUrl && (
                  <Image src={featured.artworkUrl} alt={featured.title} fill className="object-cover" sizes="100vw" />
                )}
              </div>

              {/* RIGHT — content, vertically centered */}
              <div
                className="flex flex-col justify-center col-span-2 sm:col-span-1"
                style={{
                  padding: "36px 36px 36px 40px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: "0 20px 20px 0",
                  borderLeft: "1px solid rgba(196,179,247,0.1)",
                }}
              >
                <h2
                  className="font-black"
                  style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 6 }}
                >
                  {featured.title}
                </h2>

                <p style={{ fontSize: "14px", color: "rgba(196,179,247,0.55)", fontWeight: 600, marginBottom: 24 }}>
                  {featured.artistName}
                </p>

                {featured.editorNote && (
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.72)",
                      fontStyle: "italic",
                      marginBottom: 28,
                      borderLeft: "3px solid rgba(196,179,247,0.3)",
                      paddingLeft: 18,
                    }}
                  >
                    {featured.editorNote}
                  </p>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  {featured.editorNoteByline && (
                    <p style={{ fontSize: "11px", color: "rgba(196,179,247,0.3)", fontWeight: 700, letterSpacing: "0.1em" }}>
                      — {featured.editorNoteByline}
                    </p>
                  )}
                  <a
                    href={featured.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="listen-btn flex items-center gap-2 font-black uppercase"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.25em",
                      padding: "10px 22px",
                      borderRadius: 999,
                      backgroundColor: "#c4b3f7",
                      color: "#2d1b69",
                      textDecoration: "none",
                    }}
                  >
                    <Play style={{ width: 10, height: 10 }} />
                    Listen
                  </a>
                </div>
              </div>
            </div>
          </>
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
                  className="recent-pick flex items-center gap-4 group"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: "14px 16px",
                    border: "1px solid rgba(196,179,247,0.25)",
                    textDecoration: "none",
                    display: "flex",
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
