"use client";

import { useState } from "react";
import Image from "next/image";
import { Music, Copy, Check, Download } from "lucide-react";

interface WinnerShareCardProps {
  title: string;
  artistName: string;
  artworkUrl: string | null;
  voteCount: number;
  date: string;
  shareText: string;
  canShare: boolean;
  isPro: boolean;
}

export function WinnerShareCard({
  title,
  artistName,
  artworkUrl,
  date,
  shareText,
  canShare,
}: WinnerShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.origin + "/breakthrough");
    const text = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleReddit = () => {
    const url = encodeURIComponent(window.location.origin + "/breakthrough");
    const t = encodeURIComponent(`"${title}" by ${artistName} — Breakthrough Track of the Day on MixReflect`);
    window.open(`https://www.reddit.com/submit?url=${url}&title=${t}`, "_blank");
  };

  return (
    <div className="space-y-3">
      {/* ── CARD ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#0f0a24",
          border: "1px solid rgba(196,179,247,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Artwork strip — full width, fixed height */}
        <div className="relative w-full" style={{ height: 180 }}>
          {artworkUrl ? (
            <>
              <Image src={artworkUrl} alt={title} fill className="object-cover" sizes="400px" />
              {/* gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,10,36,0.2) 0%, rgba(15,10,36,0.85) 100%)" }} />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d2a8a, #1a0f3d)" }}>
              <Music style={{ width: 40, height: 40, color: "rgba(196,179,247,0.2)" }} />
            </div>
          )}

          {/* Breakthrough label — top left */}
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <span
              style={{
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#c4b3f7",
                backgroundColor: "rgba(15,10,36,0.7)",
                padding: "4px 10px",
                borderRadius: 999,
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(196,179,247,0.2)",
              }}
            >
              Breakthrough · Track of the Day
            </span>
          </div>
        </div>

        {/* Text content */}
        <div style={{ padding: "20px 20px 16px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(196,179,247,0.35)", marginBottom: 6 }}>
            {date}
          </p>
          <h3
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(196,179,247,0.55)", fontWeight: 600 }}>
            {artistName}
          </p>

          {/* MixReflect URL */}
          <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(196,179,247,0.2)", marginTop: 14 }}>
            mixreflect.com/breakthrough
          </p>
        </div>
      </div>

      {/* ── SHARE ACTIONS ─────────────────────────────────── */}
      {canShare && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Twitter */}
          <button
            onClick={handleShareTwitter}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 16px", borderRadius: 10,
              backgroundColor: "#000", color: "#fff",
              fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
              cursor: "pointer", border: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.738-8.835L1.254 2.25H8.08l4.261 5.638 5.902-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Post on 𝕏
          </button>

          {/* Reddit */}
          <button
            onClick={handleReddit}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 16px", borderRadius: 10,
              backgroundColor: "#ff4500", color: "#fff",
              fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
              cursor: "pointer", border: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            Reddit
          </button>

          {/* Download */}
          <a
            href="/api/og/charts"
            download="breakthrough-track-of-the-day.png"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 14px", borderRadius: 10,
              backgroundColor: "rgba(196,179,247,0.1)",
              border: "1px solid rgba(196,179,247,0.2)",
              color: "rgba(196,179,247,0.6)",
              fontSize: "11px", fontWeight: 800,
              textDecoration: "none",
            }}
          >
            <Download style={{ width: 12, height: 12 }} />
          </a>

          {/* Copy */}
          <button
            onClick={handleCopyText}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 14px", borderRadius: 10,
              backgroundColor: copied ? "rgba(168,240,168,0.1)" : "rgba(196,179,247,0.1)",
              border: `1px solid ${copied ? "rgba(168,240,168,0.25)" : "rgba(196,179,247,0.2)"}`,
              color: copied ? "#a8f0a8" : "rgba(196,179,247,0.6)",
              fontSize: "11px", fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
          </button>
        </div>
      )}
    </div>
  );
}
