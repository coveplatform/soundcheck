import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#000000",
          borderRadius: 64,
        }}
      >
        {/* Waveform bars */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div
            style={{
              width: 48,
              height: 96,
              backgroundColor: "#ffffff",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              width: 48,
              height: 192,
              backgroundColor: "#ffffff",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              width: 48,
              height: 288,
              backgroundColor: "#ffffff",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              width: 48,
              height: 160,
              backgroundColor: "#ffffff",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              width: 48,
              height: 224,
              backgroundColor: "#ffffff",
              borderRadius: 12,
            }}
          />
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
