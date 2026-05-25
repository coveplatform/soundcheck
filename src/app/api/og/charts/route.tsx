import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

export async function GET() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const pick = await (prisma as any).chartSubmission.findFirst({
      where: { chartDate: today, isFeatured: true },
      include: {
        ArtistProfile: { select: { artistName: true } },
      },
    });

    const title = pick?.title ?? "Track of the Day";
    const artist = pick?.ArtistProfile?.artistName ?? "MixReflect";
    const artworkUrl = pick
      ? resolveArtwork(pick.artworkUrl, pick.sourceType ?? "SOUNDCLOUD", pick.sourceUrl ?? "")
      : null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            backgroundColor: "#2d1b69",
            fontFamily: "serif",
          }}
        >
          {/* Left content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "72px 64px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(196,179,247,0.5)",
                marginBottom: "28px",
                display: "flex",
              }}
            >
              Track of the Day · MixReflect
            </div>

            <div
              style={{
                fontSize: title.length > 30 ? "52px" : "68px",
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.0,
                marginBottom: "20px",
                letterSpacing: "-0.02em",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: "24px",
                color: "rgba(196,179,247,0.7)",
                fontWeight: 600,
                display: "flex",
              }}
            >
              {artist}
            </div>

            <div
              style={{
                marginTop: "48px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#c4b3f7",
                  color: "#2d1b69",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "12px 28px",
                  borderRadius: "999px",
                  display: "flex",
                }}
              >
                Listen now
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "rgba(196,179,247,0.35)",
                  display: "flex",
                }}
              >
                mixreflect.com/charts
              </div>
            </div>
          </div>

          {/* Right artwork */}
          <div
            style={{
              width: "420px",
              display: "flex",
              alignItems: "stretch",
              flexShrink: 0,
            }}
          >
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artworkUrl}
                alt={title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #3d2a8a 0%, #1a0f3d 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    border: "3px solid rgba(196,179,247,0.2)",
                    display: "flex",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    console.error("OG image error:", err);
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2d1b69",
            color: "#c4b3f7",
            fontSize: "32px",
            fontWeight: 900,
          }}
        >
          Track of the Day · MixReflect
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
