import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const alt = "MixReflect Review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Helper to generate star string
function _getStars(score: number): string {
  const full = Math.floor(score);
  const half = score % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "★" : "") + "☆".repeat(empty - (half ? 0 : 0));
}

export default async function OGImage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const review = await prisma.review.findUnique({
    where: { shareId },
    include: {
      track: { select: { title: true, artworkUrl: true } },
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
            background: "linear-gradient(135deg, #171717 0%, #0a0a0a 100%)",
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

  // Calculate average score
  const scores = [review.productionScore, review.originalityScore, review.vocalScore].filter(
    (s): s is number => s !== null
  );
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const roundedScore = Math.round(avgScore * 10) / 10;
  const fullStars = Math.floor(roundedScore);

  // Try to fetch artwork as base64 if available
  let artworkData: string | null = null;
  if (review.track.artworkUrl) {
    try {
      const response = await fetch(review.track.artworkUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = response.headers.get("content-type") || "image/jpeg";
        artworkData = `data:${contentType};base64,${base64}`;
      }
    } catch {
      // Artwork fetch failed, will use fallback
    }
  }

  const quote = review.bestPart
    ? `"${review.bestPart.slice(0, 90)}${review.bestPart.length > 90 ? "..." : ""}"`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #171717 0%, #0a0a0a 100%)",
          padding: 50,
        }}
      >
        {/* Left side - Artwork */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginRight: 50,
          }}
        >
          {artworkData ? (
            <img
              src={artworkData}
              width={280}
              height={280}
              style={{
                borderRadius: 12,
                border: "4px solid #262626",
              }}
            />
          ) : (
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 12,
                border: "4px solid #262626",
                background: "linear-gradient(135deg, #262626 0%, #171717 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 80,
                color: "#525252",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Right side - Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {/* Track Title */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            {review.track.title.length > 32
              ? review.track.title.slice(0, 32) + "..."
              : review.track.title}
          </div>

          {/* Score with stars */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "#84cc16",
                marginRight: 16,
              }}
            >
              {roundedScore}
            </span>
            <span style={{ fontSize: 36, color: "#84cc16", letterSpacing: 2 }}>
              {"★".repeat(fullStars)}
            </span>
            <span style={{ fontSize: 36, color: "#404040", letterSpacing: 2 }}>
              {"★".repeat(5 - fullStars)}
            </span>
          </div>

          {/* Hero signal - Would Listen Again */}
          {review.wouldListenAgain && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#84cc16",
                color: "#000",
                padding: "12px 24px",
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              ✓ Would Listen Again
            </div>
          )}

          {/* Quote */}
          {quote && (
            <div
              style={{
                display: "flex",
                borderLeft: "4px solid #84cc16",
                paddingLeft: 20,
                color: "#a3a3a3",
                fontSize: 20,
                lineHeight: 1.4,
              }}
            >
              {quote}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 40,
            }}
          >
            <div
              style={{
                backgroundColor: "#84cc16",
                padding: "6px 14px",
                fontSize: 18,
                fontWeight: 700,
                color: "#000",
                borderRadius: 4,
              }}
            >
              MixReflect
            </div>
            <span style={{ marginLeft: 14, color: "#525252", fontSize: 16 }}>
              Real Listener Feedback
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
