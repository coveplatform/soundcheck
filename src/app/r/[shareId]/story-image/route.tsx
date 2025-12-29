import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Story format: 1080x1920 (9:16)
const size = { width: 1080, height: 1920 };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
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
            background: "linear-gradient(180deg, #171717 0%, #0a0a0a 100%)",
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
    ? `"${review.bestPart.slice(0, 150)}${review.bestPart.length > 150 ? "..." : ""}"`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #171717 0%, #0a0a0a 100%)",
          padding: 60,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Artwork */}
        <div
          style={{
            display: "flex",
            marginBottom: 50,
          }}
        >
          {artworkData ? (
            <img
              src={artworkData}
              width={400}
              height={400}
              style={{
                borderRadius: 24,
                border: "6px solid #262626",
              }}
            />
          ) : (
            <div
              style={{
                width: 400,
                height: 400,
                borderRadius: 24,
                border: "6px solid #262626",
                background: "linear-gradient(135deg, #262626 0%, #171717 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 120,
                color: "#404040",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Track Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 30,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {review.track.title.length > 30
            ? review.track.title.slice(0, 30) + "..."
            : review.track.title}
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 30,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 100,
            padding: "20px 40px",
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#84cc16",
              marginRight: 20,
            }}
          >
            {roundedScore}
          </span>
          <span style={{ fontSize: 50, color: "#84cc16", letterSpacing: 4 }}>
            {"★".repeat(fullStars)}
          </span>
          <span style={{ fontSize: 50, color: "#404040", letterSpacing: 4 }}>
            {"★".repeat(5 - fullStars)}
          </span>
        </div>

        {/* Would Listen Again */}
        {review.wouldListenAgain && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#84cc16",
              color: "#000",
              padding: "16px 32px",
              fontSize: 28,
              fontWeight: 700,
              borderRadius: 100,
              marginBottom: 50,
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
              borderLeft: "6px solid #84cc16",
              paddingLeft: 30,
              color: "#a3a3a3",
              fontSize: 28,
              lineHeight: 1.5,
              maxWidth: 900,
              textAlign: "left",
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
            position: "absolute",
            bottom: 80,
          }}
        >
          <div
            style={{
              backgroundColor: "#84cc16",
              padding: "10px 20px",
              fontSize: 24,
              fontWeight: 700,
              color: "#000",
              borderRadius: 8,
            }}
          >
            MixReflect
          </div>
          <span style={{ marginLeft: 16, color: "#525252", fontSize: 22 }}>
            Real Listener Feedback
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
