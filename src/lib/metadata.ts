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
      // Extract track name from URL path
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
      // Bandcamp URLs: artist.bandcamp.com/track/track-name
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
      // YouTube: extract video ID and use as placeholder
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
    name: "Starter",
    reviews: 5,
    minProReviews: 0,
    price: 499, // cents
    description: "Quick gut-check from real listeners",
    mix: "Vetted reviewers",
  },
  STANDARD: {
    name: "Standard",
    reviews: 10,
    minProReviews: 2,
    price: 899,
    description: "More signal, more clarity",
    mix: "Guaranteed 2 PRO reviews",
  },
  PRO: {
    name: "Pro",
    reviews: 20,
    minProReviews: 5,
    price: 1499,
    description: "High-quality feedback, faster improvements",
    mix: "Guaranteed 5 PRO reviews",
  },
  DEEP_DIVE: {
    name: "Deep Dive",
    reviews: 20,
    minProReviews: 5,
    price: 1499,
    description: "Maximum signal from multiple perspectives",
    mix: "Guaranteed 5 PRO reviews",
  },
} as const;

export const ACTIVE_PACKAGE_TYPES = ["STARTER", "STANDARD", "PRO"] as const;

export type PackageType = keyof typeof PACKAGES;
