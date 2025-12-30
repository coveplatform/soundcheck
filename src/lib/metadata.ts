// URL metadata extraction utilities
// Note: In production, you'd use oEmbed APIs or scraping for more accurate data

export type TrackSource = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD";

export interface TrackMetadata {
  title: string;
  source: TrackSource;
  artworkUrl?: string;
  duration?: number; // seconds
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

  // For now, we extract basic info from the URL
  // In production, you'd call oEmbed APIs or use server-side scraping

  try {
    const parsed = new URL(url);

    if (source === "SOUNDCLOUD") {
      // Use SoundCloud's oEmbed API to get proper metadata including artwork
      try {
        const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title || "Untitled Track",
            source,
            artworkUrl: data.thumbnail_url,
          };
        }
      } catch {
        // Fall back to URL parsing if oEmbed fails
      }

      // Fallback: extract title from URL slug
      const parts = parsed.pathname.split("/").filter(Boolean);
      const trackSlug = parts[parts.length - 1] || "";
      const title = trackSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        title: title || "Untitled Track",
        source,
      };
    }

    if (source === "BANDCAMP") {
      // Use Bandcamp's oEmbed API to get proper metadata
      try {
        const oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title || "Untitled Track",
            source,
            artworkUrl: data.thumbnail_url,
          };
        }
      } catch {
        // Fall back to URL parsing if oEmbed fails
      }

      // Fallback: extract title from URL slug
      const parts = parsed.pathname.split("/").filter(Boolean);
      const trackSlug = parts[parts.length - 1] || "";
      const title = trackSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        title: title || "Untitled Track",
        source,
      };
    }

    if (source === "YOUTUBE") {
      // Use YouTube's oEmbed API to get the actual video title
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title || "Untitled Video",
            source,
            artworkUrl: data.thumbnail_url,
          };
        }
      } catch {
        // Fall back to video ID if oEmbed fails
      }

      const videoId = parsed.searchParams.get("v") || parsed.pathname.slice(1);
      return {
        title: `YouTube Video (${videoId})`,
        source,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Package configuration
export const PACKAGES = {
  STARTER: {
    name: "Quick Check",
    reviews: 5,
    minProReviews: 0,
    price: 495, // cents
    description: "Get a feel for how listeners react",
    mix: "5 genre-matched reviewers",
    features: ["5 detailed reviews", "24-hour turnaround", "Written feedback"],
  },
  STANDARD: {
    name: "Full Picture",
    reviews: 20,
    minProReviews: 0,
    price: 1495,
    description: "Maximum clarity with pattern insights",
    mix: "20 genre-matched reviewers",
    features: ["20 detailed reviews", "24-hour turnaround", "Written feedback", "Consensus highlights", "Pattern analysis"],
  },
  // Legacy packages - kept for existing tracks, not shown in UI
  PRO: {
    name: "Maximum Signal",
    reviews: 20,
    minProReviews: 5,
    price: 2995,
    description: "Highest confidence before you release",
    mix: "20 reviewers",
    features: ["20 detailed reviews", "24-hour turnaround", "Written feedback"],
  },
  DEEP_DIVE: {
    name: "Deep Dive",
    reviews: 20,
    minProReviews: 5,
    price: 2995,
    description: "Maximum signal from multiple perspectives",
    mix: "20 reviewers",
    features: ["20 detailed reviews", "24-hour turnaround", "Written feedback"],
  },
} as const;

export const ACTIVE_PACKAGE_TYPES = ["STARTER", "STANDARD"] as const;

export type PackageType = keyof typeof PACKAGES;
