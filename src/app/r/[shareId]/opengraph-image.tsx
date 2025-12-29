import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const alt = "MixReflect Review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const review = await prisma.review.findUnique({
    where: { shareId },
    include: {
      track: { select: { title: true } },
    },
  });

  if (!review || review.status !== "COMPLETED") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            color: "#fff",
            fontSize: 48,
            fontWeight: "bold",
          }}
        >
          Review Not Found
        </div>
      ),
      { ...size }
    );
  }

  const signals = [
    review.wouldListenAgain && "Would Listen Again",
    review.wouldAddToPlaylist && "Would Playlist",
    review.wouldShare && "Would Share",
    review.wouldFollow && "Would Follow",
  ].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <div
            style={{
              backgroundColor: "#84cc16",
              padding: "8px 16px",
              fontSize: 24,
              fontWeight: "bold",
              color: "#000",
            }}
          >
            MixReflect
          </div>
          <div style={{ marginLeft: 20, color: "#737373", fontSize: 24 }}>
            Listener Feedback
          </div>
        </div>

        {/* Track Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 40,
            lineHeight: 1.2,
          }}
        >
          {review.track.title.length > 40
            ? review.track.title.slice(0, 40) + "..."
            : review.track.title}
        </div>

        {/* Scores */}
        <div style={{ display: "flex", gap: 40, marginBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#737373", fontSize: 20, marginBottom: 8 }}>Production</div>
            <div style={{ color: "#fff", fontSize: 48, fontWeight: "bold" }}>
              {review.productionScore}/5
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#737373", fontSize: 20, marginBottom: 8 }}>Originality</div>
            <div style={{ color: "#fff", fontSize: 48, fontWeight: "bold" }}>
              {review.originalityScore}/5
            </div>
          </div>
        </div>

        {/* Signals */}
        {signals.length > 0 && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {signals.map((signal, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#84cc16",
                  color: "#000",
                  padding: "12px 24px",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {signal}
              </div>
            ))}
          </div>
        )}

        {/* Quote */}
        {review.bestPart && (
          <div
            style={{
              marginTop: "auto",
              borderLeft: "4px solid #84cc16",
              paddingLeft: 24,
              color: "#a3a3a3",
              fontSize: 24,
              lineHeight: 1.5,
            }}
          >
            &ldquo;{review.bestPart.slice(0, 120)}
            {review.bestPart.length > 120 ? "..." : ""}&rdquo;
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
