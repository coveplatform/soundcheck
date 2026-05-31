import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getInitial(name: string) {
  return (name.trim()[0] || "?").toUpperCase();
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function scoreBar(score: number | null) {
  if (score === null) return null;
  const filled = Math.round(score);
  return Array.from({ length: 5 }, (_, i) => i < filled);
}

export async function GET(req: NextRequest) {
  const reviewId = req.nextUrl.searchParams.get("reviewId");
  if (!reviewId) {
    return new Response("Missing reviewId", { status: 400 });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        Track: {
          include: {
            Genre: { select: { name: true }, take: 1 },
            ArtistProfile: { select: { artistName: true } },
          },
        },
        ReviewerProfile: {
          include: { User: { select: { name: true } } },
        },
      },
    });

    if (!review) {
      return new Response("Review not found", { status: 404 });
    }

    const trackTitle = review.Track?.title ?? "Untitled";
    const artistName = review.Track?.ArtistProfile?.artistName ?? "Artist";
    const genre = review.Track?.Genre?.[0]?.name ?? null;
    const artworkUrl = review.Track?.artworkUrl ?? null;
    const reviewerName = review.ReviewerProfile?.User?.name
      ? review.ReviewerProfile.User.name.trim().split(/\s+/)[0]
      : "A listener";

    const quote = review.bestPart
      ? truncate(review.bestPart, 200)
      : "This track left a strong impression.";

    const prod = review.productionScore;
    const orig = review.originalityScore;
    const vocals = review.vocalScore;

    const isHooked = review.firstImpression === "STRONG_HOOK";
    const wouldReplay = review.wouldListenAgain === true;

    const qualityLabels: Record<string, string> = {
      PROFESSIONAL: "Professional",
      RELEASE_READY: "Release Ready",
      ALMOST_THERE: "Almost There",
      DEMO_STAGE: "Demo Stage",
    };
    const qualityLabel = review.qualityLevel ? qualityLabels[review.qualityLevel as string] : null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#08050f",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "700px",
              height: "700px",
              transform: "translate(-50%, -60%)",
              background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.06) 40%, transparent 70%)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "280px",
              background: "linear-gradient(to top, rgba(139,92,246,0.08) 0%, transparent 100%)",
              display: "flex",
            }}
          />

          {/* Top label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "48px 60px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {/* MixReflect dot-wordmark */}
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#9333ea",
                  display: "flex",
                }}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                MixReflect
              </span>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Peer Feedback
            </span>
          </div>

          {/* Main quote area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 80px",
              textAlign: "center",
            }}
          >
            {/* Opening quote mark */}
            <div
              style={{
                fontSize: "120px",
                lineHeight: 0.6,
                color: "#9333ea",
                marginBottom: "32px",
                display: "flex",
                opacity: 0.6,
              }}
            >
              "
            </div>

            {/* Quote text */}
            <div
              style={{
                fontSize: quote.length > 120 ? "32px" : quote.length > 80 ? "38px" : "44px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.5,
                letterSpacing: "-0.01em",
                display: "flex",
                flexWrap: "wrap",
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {quote}
            </div>

            {/* Reviewer attribution */}
            <div
              style={{
                marginTop: "36px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(147,51,234,0.25)",
                  border: "1px solid rgba(147,51,234,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "#c084fc",
                }}
              >
                {getInitial(reviewerName)}
              </div>
              <span
                style={{
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 600,
                }}
              >
                {reviewerName}
                {genre ? ` · ${genre} fan` : ""}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              margin: "0 60px",
              height: "1px",
              background: "rgba(255,255,255,0.07)",
              display: "flex",
            }}
          />

          {/* Bottom info strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "36px 60px 48px",
              gap: "32px",
            }}
          >
            {/* Artwork + track info */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkUrl}
                  alt=""
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "10px",
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(147,51,234,0.2)",
                    border: "1px solid rgba(147,51,234,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#9333ea",
                  }}
                >
                  {(trackTitle[0] ?? "♪").toUpperCase()}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {truncate(trackTitle, 28)}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                  }}
                >
                  {artistName}
                </span>
              </div>
            </div>

            {/* Scores + badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
              {/* Score rows */}
              {[
                { label: "Production", score: prod },
                { label: "Originality", score: orig },
                ...(vocals !== null ? [{ label: "Vocals", score: vocals }] : []),
              ].map(({ label, score }) => {
                const bars = scoreBar(score);
                if (!bars) return null;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {label}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {bars.map((filled, i) => (
                        <div
                          key={i}
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: filled ? "#9333ea" : "rgba(255,255,255,0.12)",
                            display: "flex",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Badges */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {qualityLabel && (
                  <div
                    style={{
                      backgroundColor: "rgba(147,51,234,0.2)",
                      border: "1px solid rgba(147,51,234,0.4)",
                      borderRadius: "999px",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 900,
                      color: "#c084fc",
                      letterSpacing: "0.05em",
                      display: "flex",
                    }}
                  >
                    {qualityLabel}
                  </div>
                )}
                {isHooked && (
                  <div
                    style={{
                      backgroundColor: "rgba(147,51,234,0.2)",
                      border: "1px solid rgba(147,51,234,0.4)",
                      borderRadius: "999px",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 900,
                      color: "#c084fc",
                      letterSpacing: "0.05em",
                      display: "flex",
                    }}
                  >
                    Hooked
                  </div>
                )}
                {wouldReplay && (
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "999px",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.05em",
                      display: "flex",
                    }}
                  >
                    Would replay
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer URL */}
          <div
            style={{
              padding: "0 60px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.15)", fontWeight: 600, letterSpacing: "0.05em" }}>
              mixreflect.com
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.1)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Get feedback on your music
            </span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  } catch (err) {
    console.error("Review card OG error:", err);
    return new Response("Failed to generate card", { status: 500 });
  }
}
