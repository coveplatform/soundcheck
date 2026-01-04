"use client";

import { cn } from "@/lib/utils";
import { SoundCloudIcon, BandcampIcon, YouTubeIcon } from "./platform-icons";

type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | null;

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
    borderActive: "border-orange-300"
  },
  {
    id: "BANDCAMP" as const,
    name: "Bandcamp",
    Icon: BandcampIcon,
    color: "#1da0c3",
    bgActive: "bg-cyan-50",
    borderActive: "border-cyan-300"
  },
  {
    id: "YOUTUBE" as const,
    name: "YouTube",
    Icon: YouTubeIcon,
    color: "#ff0000",
    bgActive: "bg-red-50",
    borderActive: "border-red-300"
  },
];

/**
 * Shows supported platforms with optional active state highlighting.
 * Use below URL input fields to guide users on what links are accepted.
 */
export function SupportedPlatforms({
  activeSource,
  variant = "default",
  className
}: SupportedPlatformsProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 text-neutral-400", className)}>
        <span className="text-xs">Works with</span>
        <div className="flex items-center gap-2">
          {platforms.map((platform) => {
            const isActive = activeSource === platform.id;
            return (
              <div
                key={platform.id}
                className={cn(
                  "transition-all duration-200",
                  isActive ? "scale-110" : "opacity-60"
                )}
                title={platform.name}
              >
                <platform.Icon
                  className="h-4 w-4"
                  style={{ color: isActive ? platform.color : "currentColor" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 flex-wrap", className)}>
      {platforms.map((platform) => {
        const isActive = activeSource === platform.id;
        return (
          <div
            key={platform.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200",
              isActive
                ? cn(platform.bgActive, platform.borderActive, "border-2")
                : "border-neutral-200 bg-neutral-50"
            )}
          >
            <platform.Icon
              className={cn("h-4 w-4 transition-colors", isActive && "scale-110")}
              style={{ color: isActive ? platform.color : "#9ca3af" }}
            />
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-neutral-700" : "text-neutral-400"
              )}
            >
              {platform.name}
            </span>
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
 */
export function PlatformBadge({ source, className }: PlatformBadgeProps) {
  if (!source) return null;

  const platform = platforms.find(p => p.id === source);
  if (!platform) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
        platform.bgActive,
        className
      )}
    >
      <platform.Icon className="h-3.5 w-3.5" style={{ color: platform.color }} />
      <span className="text-neutral-600">{platform.name}</span>
    </div>
  );
}
