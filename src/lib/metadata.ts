// URL metadata extraction utilities
// Note: In production, you'd use oEmbed APIs or scraping for more accurate data

export type TrackSource = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD";

export interface TrackMetadata {
  title: string;
  source: TrackSource;
  artworkUrl?: string;
  duration?: number; // seconds
}

// Resolves short SoundCloud URLs (on.soundcloud.com) to their full URL by following redirects.
// Falls back to the original URL if resolution fails or times out.
export async function resolveShortUrl(url: string): Promise<string> {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname !== "on.soundcloud.com") return url;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.url || url;
  } catch {
    return url;
  }
}

export function detectSource(url: string): TrackSource | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes("soundcloud.com")) {
      return "SOUNDCLOUD";
    }
    if (hostname.includes("bandcamp.com")) {
      return "BANDCAMP";
    }
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "YOUTUBE";
    }

    return null;
  } catch {
    return null;
  }
}

export function validateTrackUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: "Please enter a URL" };
  }

  try {
    new URL(url);
  } catch {
    return { valid: false, error: "Please enter a valid URL" };
  }

  const source = detectSource(url);
  if (!source) {
    return {
      valid: false,
      error: "Please enter a SoundCloud, Bandcamp, or YouTube URL",
    };
  }

  // Validate Bandcamp URLs are track pages (not album pages)
  if (source === "BANDCAMP") {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    if (!path.includes("/track/")) {
      return {
        valid: false,
        error: "Please enter a Bandcamp track URL (not an album page)",
      };
    }
  }

  return { valid: true };
}

export async function fetchTrackMetadata(url: string): Promise<TrackMetadata | null> {
  const source = detectSource(url);
  if (!source) return null;

  const fallback = (): TrackMetadata => {
    try {
      const parsed = new URL(url);

      if (source === "YOUTUBE") {
        const v = parsed.searchParams.get("v");
        const id = v || (parsed.hostname.toLowerCase().includes("youtu.be")
          ? parsed.pathname.replace(/^\//, "")
          : "");
        const safeId = (id || "").trim();
        return {
          source,
          title: safeId ? `YouTube Video (${safeId})` : "Untitled Track",
        };
      }

      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const last = pathParts[pathParts.length - 1] || "";
      const title = last
        ? last
            .replace(/[-_]+/g, " ")
            .trim()
            .split(/\s+/g)
            .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
            .join(" ")
        : "Untitled Track";

      return { source, title };
    } catch {
      return { source, title: "Untitled Track" };
    }
  };

  // Fetch metadata from oEmbed API - this verifies the link is valid/public
  try {
    const response = await fetch("/api/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || "Untitled Track",
        source,
        artworkUrl: data.artworkUrl,
      };
    }

    // oEmbed failed - fall back to a best-effort derived title
    return fallback();
  } catch {
    // Network error or other failure - fall back to a best-effort derived title
    return fallback();
  }
}

// Package configuration
export const PACKAGES = {
  RELEASE_DECISION: {
    name: "Release Decision",
    reviews: 10, // 10-12 expert reviews
    minProReviews: 10, // All must be PRO tier
    price: 995, // $9.95 cash only - premium service
    creditsRequired: 0, // Cash only - no credit option
    description: "Expert panel verdict: Should you release this track? Get a clear Go/No-Go with actionable fixes",
    mix: "10-12 expert reviewers (100+ reviews, 4.5+ rating)",
    features: [
      "Clear Go/No-Go verdict from expert panel",
      "Release readiness score (0-100)",
      "Top 3 fixes ranked by impact & time estimate",
      "Competitive genre benchmarking",
      "Strongest elements & biggest risks identified",
      "Compiled technical analysis report",
      "Compiled actionable report delivered to email",
      "24-hour delivery guarantee",
    ],
  },
  PEER: {
    name: "General Feedback",
    reviews: 0, // dynamic - set by user
    minProReviews: 0,
    price: 0, // free - uses credits
    creditsRequired: 0, // 1 credit per review
    description: "Get listener opinions using credits",
    mix: "Genre-matched community reviewers",
    features: [
      "Community reviews",
      "Genre matching",
      "Earn credits by reviewing others",
      "Flexible review count (1-50)",
      "Optional add-ons (Verified Reviewers, Rush Delivery)",
    ],
  },
  // DEPRECATED - Legacy packages kept for backwards compatibility only
  STARTER: {
    name: "Listener Pulse (Deprecated)",
    reviews: 5,
    minProReviews: 0,
    price: 495,
    creditsRequired: 0,
    description: "Legacy package",
    mix: "5 genre-matched reviewers",
    features: ["5 detailed reviews"],
    deprecated: true,
  },
  STANDARD: {
    name: "Release Ready (Deprecated)",
    reviews: 20,
    minProReviews: 2,
    price: 1495,
    creditsRequired: 0,
    description: "Legacy package",
    mix: "20 genre-matched reviewers",
    features: ["20 detailed reviews"],
    deprecated: true,
  },
  PRO: {
    name: "Maximum Signal (Deprecated)",
    reviews: 20,
    minProReviews: 5,
    price: 2995,
    creditsRequired: 0,
    description: "Legacy package",
    mix: "20 reviewers",
    features: ["20 detailed reviews"],
    deprecated: true,
  },
  DEEP_DIVE: {
    name: "Deep Dive (Deprecated)",
    reviews: 20,
    minProReviews: 5,
    price: 2995,
    creditsRequired: 0,
    description: "Legacy package",
    mix: "20 reviewers",
    features: ["20 detailed reviews"],
    deprecated: true,
  },
} as const;

export const ACTIVE_PACKAGE_TYPES = ["RELEASE_DECISION", "PEER"] as const;

export type PackageType = keyof typeof PACKAGES;
