import { ImageResponse } from "next/og";

// Dynamically generated social share image (1200x630) in the verdict aesthetic.
// Replaces the missing static /og-image.png — used site-wide via the file
// convention, so every page that doesn't set its own OG image gets this.

export const alt =
  "MixReflect — know if your track is ready to release, then send it to a room of real listeners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#6ee7ff";
const GREEN = "#7cffc4";
const VIOLET = "#b8a4ff";
const PINK = "#ff7a90";

const LADDER = [
  { label: "not ready", ink: PINK },
  { label: "needs work", ink: VIOLET },
  { label: "almost there", ink: ACCENT, on: true },
  { label: "release ready", ink: GREEN },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          padding: "72px",
          fontFamily: "monospace",
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", color: "#f4f4ef" }}>
          <div
            style={{
              width: 36,
              height: 36,
              backgroundColor: ACCENT,
              marginRight: 18,
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px" }}>
            mixreflect
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: "#f4f4ef",
              lineHeight: 1.04,
              letterSpacing: "-3px",
              maxWidth: 980,
            }}
          >
            know if your track is ready to release.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(244,244,239,0.62)",
              marginTop: 26,
              maxWidth: 900,
            }}
          >
            a measured release verdict — then a room of real listeners to back it up.
          </div>
        </div>

        {/* verdict ladder */}
        <div style={{ display: "flex", gap: 10 }}>
          {LADDER.map((l) => (
            <div
              key={l.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 26px",
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: l.on ? l.ink : "transparent",
                color: l.on ? "#000" : "rgba(244,244,239,0.4)",
                border: `2px solid ${l.on ? l.ink : "rgba(255,255,255,0.14)"}`,
              }}
            >
              {l.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
