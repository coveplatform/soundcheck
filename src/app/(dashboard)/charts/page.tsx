"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, ExternalLink, Play, Share2, Check, Download } from "lucide-react";

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
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = "https://www.mixreflect.com/charts";

  const handleCopy = async (title: string, artist: string) => {
    const text = `"${title}" by ${artist} is today's Track of the Day on MixReflect 🎵\n${shareUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

                <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: shareOpen ? 20 : 0 }}>
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
                    onClick={() => setShareOpen((v) => !v)}
                    className="listen-btn flex items-center gap-2 font-black uppercase"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.25em",
                      padding: "10px 22px",
                      borderRadius: 999,
                      backgroundColor: shareOpen ? "rgba(196,179,247,0.2)" : "rgba(196,179,247,0.1)",
                      color: "#c4b3f7",
                      border: "1px solid rgba(196,179,247,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <Share2 style={{ width: 10, height: 10 }} />
                    Share
                  </button>
                </div>

                {shareOpen && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {/* Twitter/X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${featured.title}" by ${featured.artistName} is today's Track of the Day on MixReflect 🎵`)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 18px", borderRadius: 999,
                        backgroundColor: "#000", color: "#fff",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                        textDecoration: "none",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.738-8.835L1.254 2.25H8.08l4.261 5.638 5.902-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      Post
                    </a>
                    {/* Reddit */}
                    <a
                      href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`"${featured.title}" by ${featured.artistName} — Track of the Day on MixReflect`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 18px", borderRadius: 999,
                        backgroundColor: "#ff4500", color: "#fff",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                        textDecoration: "none",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                      Reddit
                    </a>
                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 18px", borderRadius: 999,
                        backgroundColor: "#1877f2", color: "#fff",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                        textDecoration: "none",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>
                    {/* Instagram — download card */}
                    <a
                      href="/api/og/charts"
                      download="mixreflect-track-of-the-day.png"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 18px", borderRadius: 999,
                        background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                        color: "#fff",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                        textDecoration: "none",
                      }}
                    >
                      <Download style={{ width: 11, height: 11 }} />
                      Instagram
                    </a>
                    {/* Copy link */}
                    <button
                      onClick={() => handleCopy(featured.title, featured.artistName)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 18px", borderRadius: 999,
                        backgroundColor: "rgba(196,179,247,0.1)",
                        color: copied ? "#a8f0a8" : "rgba(196,179,247,0.6)",
                        border: "1px solid rgba(196,179,247,0.2)",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                        cursor: "pointer",
                      }}
                    >
                      {copied ? <Check style={{ width: 11, height: 11 }} /> : <Share2 style={{ width: 11, height: 11 }} />}
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                )}
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

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <div style={{ backgroundColor: "#0f0a24" }}>
        <style>{`
          .hiw-step {
            border-top: 1px solid rgba(196,179,247,0.08);
            transition: background-color 0.2s ease;
          }
          .hiw-step:hover {
            background-color: rgba(196,179,247,0.03);
          }
          .hiw-cta {
            transition: background-color 0.15s ease, transform 0.15s ease;
          }
          .hiw-cta:hover {
            background-color: #d4c7ff !important;
            transform: translateY(-2px);
          }
        `}</style>

        <div className="max-w-4xl mx-auto px-6 sm:px-12" style={{ paddingTop: 96, paddingBottom: 80 }}>
          <p style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(196,179,247,0.3)", marginBottom: 48 }}>
            How it works
          </p>

          {[
            {
              n: "01",
              heading: "Submit your track.",
              body: "Drop a SoundCloud, YouTube, or Bandcamp link. Real musicians — not algorithms — get assigned to your queue.",
            },
            {
              n: "02",
              heading: "Get honest feedback.",
              body: "Independent artists listen and write structured reviews. What's landing. What isn't. What to fix first.",
            },
            {
              n: "03",
              heading: "The best track wins the day.",
              body: "Every morning, the highest-scoring track from the previous day's reviews gets featured right here. No votes. No campaigns. Just the music.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="hiw-step"
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "0 48px",
                padding: "48px 0",
                alignItems: "start",
              }}
            >
              <p
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 900,
                  color: "rgba(196,179,247,0.08)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step.n}
              </p>
              <div>
                <p
                  style={{
                    fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: 14,
                  }}
                >
                  {step.heading}
                </p>
                <p style={{ fontSize: "15px", color: "rgba(196,179,247,0.5)", lineHeight: 1.8, maxWidth: 520 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid rgba(196,179,247,0.08)", paddingTop: 64, paddingBottom: 96, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <p style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>
              Your track could be next.
            </p>
            <a
              href="/artist/submit"
              className="hiw-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 32px",
                borderRadius: 999,
                backgroundColor: "#c4b3f7",
                color: "#0f0a24",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Submit a track
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
