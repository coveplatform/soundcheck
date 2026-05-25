"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, ExternalLink, Play, Share2, Check } from "lucide-react";

function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1).split("?")[0] || null;
    return parsed.searchParams.get("v");
  } catch { return null; }
}

function resolveArtwork(artworkUrl: string | null, sourceType: string, sourceUrl: string): string | null {
  if (artworkUrl) return artworkUrl;
  if (sourceType === "YOUTUBE") {
    const id = getYouTubeId(sourceUrl);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
}

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
  const [artworkFailed, setArtworkFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (title: string, artist: string) => {
    const url = "https://www.mixreflect.com/charts";
    const text = `"${title}" by ${artist} is today's Track of the Day on MixReflect 🎵`;
    if (navigator.share) {
      try { await navigator.share({ title: `Track of the Day · MixReflect`, text, url }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#ede8ff" }}>
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
      <div style={{ backgroundColor: "#2d1b69", paddingTop: 48 }}>
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
            <div
              className="max-w-6xl mx-auto px-6 sm:px-12 pb-16"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, alignItems: "start" }}
            >
              {/* LEFT — content */}
              <div
                className="flex flex-col justify-center col-span-2 sm:col-span-1"
                style={{ padding: "40px 48px 40px 0" }}
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
                      marginBottom: 28,
                    }}
                  >
                    {featured.editorNote}
                  </p>
                )}

                {featured.editorNoteByline && (
                  <p style={{ fontSize: "11px", color: "rgba(196,179,247,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 20 }}>
                    — {featured.editorNoteByline}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
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
                  <button
                    onClick={() => handleShare(featured.title, featured.artistName)}
                    className="listen-btn flex items-center gap-2 font-black uppercase"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.25em",
                      padding: "10px 22px",
                      borderRadius: 999,
                      backgroundColor: "rgba(196,179,247,0.12)",
                      color: "#c4b3f7",
                      border: "1px solid rgba(196,179,247,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? <Check style={{ width: 10, height: 10 }} /> : <Share2 style={{ width: 10, height: 10 }} />}
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>
              </div>

              {/* RIGHT — artwork */}
              {(() => {
                const src = resolveArtwork(featured.artworkUrl, featured.sourceType, featured.sourceUrl);
                return (
                  <div
                    className="artwork-wrap relative hidden sm:block"
                    style={{ aspectRatio: "1 / 1", borderRadius: 20, overflow: "hidden", background: "linear-gradient(135deg, #3d2a8a 0%, #1a0f3d 100%)" }}
                  >
                    {src && !artworkFailed ? (
                      <Image src={src} alt={featured.title} fill className="object-cover" sizes="50vw" onError={() => setArtworkFailed(true)} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <Music style={{ width: 52, height: 52, color: "rgba(196,179,247,0.2)" }} />
                        <p style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(196,179,247,0.2)", textAlign: "center", padding: "0 24px" }}>
                          {featured.title}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Mobile artwork */}
              {(() => {
                const src = resolveArtwork(featured.artworkUrl, featured.sourceType, featured.sourceUrl);
                return (
                  <div
                    className="relative w-full sm:hidden col-span-2"
                    style={{ aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #3d2a8a 0%, #1a0f3d 100%)", marginBottom: 24 }}
                  >
                    {src && !artworkFailed ? (
                      <Image src={src} alt={featured.title} fill className="object-cover" sizes="100vw" onError={() => setArtworkFailed(true)} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <Music style={{ width: 40, height: 40, color: "rgba(196,179,247,0.2)" }} />
                      </div>
                    )}
                  </div>
                );
              })()}
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
        <div style={{ backgroundColor: "#e2d9ff" }} className="py-12">
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
                    {(() => {
                      const src = resolveArtwork(pick.artworkUrl, pick.sourceType, pick.sourceUrl);
                      return src ? (
                        <Image src={src} alt={pick.title} fill className="object-cover" sizes="52px" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d2a8a, #1a0f3d)" }}>
                          <Music style={{ width: 16, height: 16, color: "rgba(196,179,247,0.4)" }} />
                        </div>
                      );
                    })()}
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
      <div style={{ backgroundColor: "#ede8ff", paddingBottom: 96 }} />
    </div>
  );
}
