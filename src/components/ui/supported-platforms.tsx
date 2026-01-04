"use client";

import { cn } from "@/lib/utils";
import { SoundCloudIcon, BandcampIcon, YouTubeIcon } from "./platform-icons";

type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null;

interface SupportedPlatformsProps {
  /** Currently detected source from URL, if any */
  activeSource?: SourceType;
  /** Display variant */
  variant?: "default" | "compact";
  className?: string;
}

const platforms = [
  {
    id: "SOUNDCLOUD" as const,
    name: "SoundCloud",
    Icon: SoundCloudIcon,
    color: "#ff5500",
    bgActive: "bg-orange-50",
    borderActive: "border-orange-400"
  },
  {
    id: "BANDCAMP" as const,
    name: "Bandcamp",
    Icon: BandcampIcon,
    color: "#1da0c3",
    bgActive: "bg-cyan-50",
    borderActive: "border-cyan-400"
  },
  {
    id: "YOUTUBE" as const,
    name: "YouTube",
    Icon: YouTubeIcon,
    color: "#ff0000",
    bgActive: "bg-red-50",
    borderActive: "border-red-400"
  },
];

/**
 * Shows supported platforms with optional active state highlighting.
 * Use below URL input fields to guide users on what links are accepted.
 * Icons only - no text labels.
 */
export function SupportedPlatforms({
  activeSource,
  variant = "default",
  className
}: SupportedPlatformsProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {platforms.map((platform) => {
          const isActive = activeSource === platform.id;
          return (
            <div
              key={platform.id}
              className={cn(
                "transition-all duration-200",
                isActive ? "scale-125" : "opacity-50 hover:opacity-75"
              )}
              title={platform.name}
              style={{ color: isActive ? platform.color : "#9ca3af" }}
            >
              <platform.Icon className="h-6 w-6" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {platforms.map((platform) => {
        const isActive = activeSource === platform.id;
        return (
          <div
            key={platform.id}
            className={cn(
              "p-2.5 rounded-xl border-2 transition-all duration-200",
              isActive
                ? cn(platform.bgActive, platform.borderActive, "scale-110")
                : "border-neutral-200 bg-neutral-50 hover:border-neutral-300"
            )}
            title={platform.name}
            style={{ color: isActive ? platform.color : "#9ca3af" }}
          >
            <platform.Icon className="h-6 w-6 transition-transform" />
          </div>
        );
      })}
    </div>
  );
}

interface PlatformBadgeProps {
  source: SourceType;
  className?: string;
}

/**
 * Single platform badge for showing detected source in track previews.
 * Icon only with colored background.
 */
export function PlatformBadge({ source, className }: PlatformBadgeProps) {
  if (!source) return null;

  const platform = platforms.find(p => p.id === source);
  if (!platform) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center p-1.5 rounded-lg",
        platform.bgActive,
        className
      )}
      title={platform.name}
      style={{ color: platform.color }}
    >
      <platform.Icon className="h-5 w-5" />
    </div>
  );
}
