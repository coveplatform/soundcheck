"use client";

import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface GenreSelectorProps {
  genres: Genre[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxSelections?: number;
  minSelections?: number;
  variant?: "artist" | "reviewer";
  theme?: "light" | "dark";
}

// Genre categories with their parent slug and sub-genre slugs
const GENRE_CATEGORIES: Record<
  string,
  { label: string; parentSlug: string; childSlugs: string[] }
> = {
  electronic: {
    label: "Electronic",
    parentSlug: "electronic",
    childSlugs: [
      "house",
      "deep-house",
      "tech-house",
      "progressive-house",
      "techno",
      "hard-techno",
      "minimal",
      "drum-and-bass",
      "jungle",
      "breaks",
      "uk-garage",
      "speed-garage",
      "dubstep",
      "trance",
      "hardstyle",
      "hardcore-electronic",
      "ambient",
      "downtempo",
      "idm",
      "edm",
      "synthwave",
      "lo-fi",
      "future-bass",
      "electronica",
    ],
  },
  "hip-hop": {
    label: "Hip-Hop & R&B",
    parentSlug: "hip-hop-rnb",
    childSlugs: [
      "hip-hop",
      "trap",
      "rnb",
      "boom-bap",
      "drill",
      "uk-rap",
      "grime",
      "phonk",
      "cloud-rap",
      "lo-fi-hip-hop",
      "old-school-hip-hop",
      "conscious-hip-hop",
      "neo-soul",
    ],
  },
  rock: {
    label: "Rock & Metal",
    parentSlug: "rock-metal",
    childSlugs: [
      "rock",
      "indie-rock",
      "alternative",
      "grunge",
      "hard-rock",
      "prog-rock",
      "post-rock",
      "post-punk",
      "emo",
      "punk",
      "pop-punk",
      "metal",
      "metalcore",
      "death-metal",
      "black-metal",
      "thrash-metal",
      "nu-metal",
      "hardcore-punk",
    ],
  },
  pop: {
    label: "Pop",
    parentSlug: "pop-dance",
    childSlugs: [
      "pop",
      "indie-pop",
      "electropop",
      "synth-pop",
      "hyperpop",
      "dream-pop",
      "bedroom-pop",
      "art-pop",
      "dance-pop",
      "k-pop",
    ],
  },
  "jazz-soul": {
    label: "Jazz & Soul",
    parentSlug: "jazz-soul",
    childSlugs: [
      "jazz",
      "soul",
      "funk",
      "blues",
      "gospel",
      "smooth-jazz",
      "jazz-fusion",
      "bossa-nova",
    ],
  },
  other: {
    label: "Other",
    parentSlug: "other",
    childSlugs: [
      "reggae",
      "dancehall",
      "afrobeats",
      "latin",
      "country",
      "folk",
      "acoustic",
      "classical",
      "world",
      "experimental",
      "singer-songwriter",
    ],
  },
};

const CATEGORY_ORDER = ["electronic", "hip-hop", "rock", "pop", "jazz-soul", "other"];

export function GenreSelector({
  genres,
  selectedIds,
  onToggle,
  maxSelections = 3,
  minSelections = 1,
  variant = "artist",
  theme = "light",
}: GenreSelectorProps) {
  const isDark = theme === "dark";
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Get selected genres for display
  const selectedGenres = genres.filter((g) => selectedIds.includes(g.id));

  // Check if we've hit max selections
  const atMax = selectedIds.length >= maxSelections;

  // Get parent genre for a category
  const getParentGenre = (categoryKey: string) => {
    const category = GENRE_CATEGORIES[categoryKey];
    if (!category) return null;
    return genres.find((g) => g.slug === category.parentSlug) || null;
  };

  // Get child genres for a category
  const getChildGenres = (categoryKey: string) => {
    const category = GENRE_CATEGORIES[categoryKey];
    if (!category) return [];
    return genres.filter((g) => category.childSlugs.includes(g.slug));
  };

  // Check if parent is selected
  const isParentSelected = (categoryKey: string) => {
    const parent = getParentGenre(categoryKey);
    return parent ? selectedIds.includes(parent.id) : false;
  };

  // Count selected children in category
  const getSelectedChildCount = (categoryKey: string) => {
    const children = getChildGenres(categoryKey);
    return children.filter((g) => selectedIds.includes(g.id)).length;
  };

  const variantStyles = {
    artist: {
      light: {
        selected: "bg-lime-500 border-black text-black",
        unselected: "bg-white border-black text-black hover:bg-lime-100",
        chip: "bg-lime-500 border-black text-black",
        parentSelected: "bg-lime-500",
        parentUnselected: "bg-white hover:bg-lime-50",
        categoryBorder: "border-black",
        expandedBg: "bg-neutral-50",
        expandedBorder: "border-black",
        helperText: "text-neutral-500",
        counterText: "text-neutral-500",
        disabledBtn: "bg-neutral-200 border-neutral-300 text-neutral-400",
      },
      dark: {
        selected: "bg-lime-500 border-lime-500 text-black",
        unselected: "bg-transparent border-neutral-600 text-neutral-300 hover:border-lime-500 hover:text-white",
        chip: "bg-lime-500 border-lime-500 text-black",
        parentSelected: "bg-lime-500 text-black",
        parentUnselected: "bg-neutral-900 hover:bg-neutral-800 text-white",
        categoryBorder: "border-neutral-700",
        expandedBg: "bg-neutral-900",
        expandedBorder: "border-neutral-700",
        helperText: "text-neutral-400",
        counterText: "text-neutral-400",
        disabledBtn: "bg-neutral-800 border-neutral-700 text-neutral-600",
      },
    },
    reviewer: {
      light: {
        selected: "bg-orange-400 border-black text-black",
        unselected: "bg-white border-black text-black hover:bg-orange-100",
        chip: "bg-orange-400 border-black text-black",
        parentSelected: "bg-orange-400",
        parentUnselected: "bg-white hover:bg-orange-50",
        categoryBorder: "border-black",
        expandedBg: "bg-neutral-50",
        expandedBorder: "border-black",
        helperText: "text-neutral-500",
        counterText: "text-neutral-500",
        disabledBtn: "bg-neutral-200 border-neutral-300 text-neutral-400",
      },
      dark: {
        selected: "bg-orange-400 border-orange-400 text-black",
        unselected: "bg-transparent border-neutral-600 text-neutral-300 hover:border-orange-400 hover:text-white",
        chip: "bg-orange-400 border-orange-400 text-black",
        parentSelected: "bg-orange-400 text-black",
        parentUnselected: "bg-neutral-900 hover:bg-neutral-800 text-white",
        categoryBorder: "border-neutral-700",
        expandedBg: "bg-neutral-900",
        expandedBorder: "border-neutral-700",
        helperText: "text-neutral-400",
        counterText: "text-neutral-400",
        disabledBtn: "bg-neutral-800 border-neutral-700 text-neutral-600",
      },
    },
  };

  const styles = variantStyles[variant][theme];

  return (
    <div className="space-y-4">
      {/* Selected genres chips */}
      {selectedGenres.length > 0 && (
        <div className={cn(
          "flex flex-wrap gap-2 pb-4 border-b-2",
          isDark ? "border-neutral-700" : "border-neutral-200"
        )}>
          {selectedGenres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => onToggle(genre.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold border-2 transition-colors",
                styles.chip
              )}
            >
              {genre.name}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className={cn("inline-flex items-center text-sm font-mono", styles.counterText)}>
            {selectedIds.length}/{maxSelections}
          </span>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {CATEGORY_ORDER.map((categoryKey) => {
          const category = GENRE_CATEGORIES[categoryKey];
          const isExpanded = expandedCategory === categoryKey;
          const parentGenre = getParentGenre(categoryKey);
          const parentSelected = isParentSelected(categoryKey);
          const childCount = getSelectedChildCount(categoryKey);
          const childGenres = getChildGenres(categoryKey);
          const canSelectParent = !atMax || parentSelected;

          return (
            <div key={categoryKey} className={cn("border-2", styles.categoryBorder)}>
              {/* Category header - now has two click zones */}
              <div
                className={cn(
                  "flex items-center transition-colors",
                  parentSelected ? styles.parentSelected : styles.parentUnselected
                )}
              >
                {/* Selectable area - click to toggle parent genre */}
                {parentGenre && (
                  <button
                    type="button"
                    onClick={() => canSelectParent && onToggle(parentGenre.id)}
                    disabled={!canSelectParent}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 flex-1 text-left font-bold transition-colors",
                      !canSelectParent && !parentSelected && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 border-2 flex items-center justify-center flex-shrink-0",
                        isDark ? "border-neutral-500" : "border-black",
                        parentSelected ? (isDark ? "bg-lime-500 border-lime-500" : "bg-black") : (isDark ? "bg-neutral-800" : "bg-white")
                      )}
                    >
                      {parentSelected && <Check className={cn("h-3 w-3", isDark ? "text-black" : "text-white")} />}
                    </div>
                    <span>{category.label}</span>
                    {childCount > 0 && !parentSelected && (
                      <span
                        className={cn(
                          "text-xs font-mono px-1.5 py-0.5",
                          variant === "artist"
                            ? "bg-lime-500 text-black"
                            : "bg-orange-400 text-black"
                        )}
                      >
                        +{childCount} specific
                      </span>
                    )}
                  </button>
                )}

                {/* Expand button */}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                  className={cn(
                    "px-4 py-3 border-l-2 transition-colors",
                    isDark ? "border-neutral-700 hover:bg-white/5" : "border-black hover:bg-black/5"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
              </div>

              {/* Sub-genres */}
              {isExpanded && (
                <div className={cn(
                  "px-4 py-3 border-t-2",
                  styles.expandedBorder,
                  styles.expandedBg
                )}>
                  <p className={cn("text-xs font-medium mb-3", styles.helperText)}>
                    {parentSelected
                      ? "You're matched with all sub-genres. Pick specific ones to narrow:"
                      : "Or pick specific sub-genres:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {childGenres.map((genre) => {
                      const isSelected = selectedIds.includes(genre.id);
                      const isDisabled = atMax && !isSelected;

                      return (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => !isDisabled && onToggle(genre.id)}
                          disabled={isDisabled}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold border-2 transition-colors",
                            isSelected
                              ? styles.selected
                              : isDisabled
                                ? cn(styles.disabledBtn, "cursor-not-allowed")
                                : styles.unselected
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {genre.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      {selectedIds.length === 0 && (
        <p className={cn("text-sm", styles.helperText)}>
          Select broad genres or expand to pick specific sub-genres
        </p>
      )}
    </div>
  );
}
