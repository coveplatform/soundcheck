"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type GenreTagVariant = "artist" | "reviewer" | "neutral";
type GenreTagSize = "sm" | "default";

interface GenreTagProps {
  name: string;
  variant?: GenreTagVariant;
  size?: GenreTagSize;
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  artist: {
    selected: "bg-lime-500 text-black border-black",
    unselected: "bg-white text-black border-black hover:bg-lime-100",
    display: "bg-lime-100 text-lime-800 border-lime-300",
  },
  reviewer: {
    selected: "bg-orange-400 text-black border-black",
    unselected: "bg-white text-black border-black hover:bg-orange-100",
    display: "bg-orange-100 text-orange-800 border-orange-300",
  },
  neutral: {
    selected: "bg-neutral-800 text-white border-black",
    unselected: "bg-white text-black border-black hover:bg-neutral-100",
    display: "bg-neutral-100 text-neutral-700 border-neutral-300",
  },
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  default: "px-3 py-1.5 text-sm",
};

export function GenreTag({
  name,
  variant = "neutral",
  size = "default",
  selected = false,
  interactive = false,
  onClick,
  className,
}: GenreTagProps) {
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const visualStyle = interactive
    ? selected
      ? styles.selected
      : styles.unselected
    : styles.display;

  const baseClasses = cn(
    "inline-flex items-center gap-1 font-bold border-2 transition-colors",
    sizeStyle,
    visualStyle,
    interactive && "cursor-pointer",
    className
  );

  if (interactive && onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {selected && <Check className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />}
        {name}
      </button>
    );
  }

  return <span className={baseClasses}>{name}</span>;
}

interface GenreTagListProps {
  genres: Array<{ id: string; name: string }>;
  variant?: GenreTagVariant;
  size?: GenreTagSize;
  selectedIds?: string[];
  interactive?: boolean;
  onToggle?: (id: string) => void;
  className?: string;
  maxDisplay?: number;
}

export function GenreTagList({
  genres,
  variant = "neutral",
  size = "default",
  selectedIds = [],
  interactive = false,
  onToggle,
  className,
  maxDisplay,
}: GenreTagListProps) {
  const displayGenres = maxDisplay ? genres.slice(0, maxDisplay) : genres;
  const remaining = maxDisplay ? genres.length - maxDisplay : 0;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {displayGenres.map((genre) => (
        <GenreTag
          key={genre.id}
          name={genre.name}
          variant={variant}
          size={size}
          selected={selectedIds.includes(genre.id)}
          interactive={interactive}
          onClick={interactive && onToggle ? () => onToggle(genre.id) : undefined}
        />
      ))}
      {remaining > 0 && (
        <span className={cn(
          "inline-flex items-center font-bold text-neutral-500",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          +{remaining} more
        </span>
      )}
    </div>
  );
}
