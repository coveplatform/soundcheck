"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Grid3x3, BarChart3 } from "lucide-react";

interface TracksViewToggleProps {
  defaultView?: "grid" | "portfolio";
  isPro: boolean;
  onViewChange?: (view: "grid" | "portfolio") => void;
  gridView: React.ReactNode;
  portfolioView: React.ReactNode;
}

export function TracksViewToggle({
  defaultView = "grid",
  isPro,
  onViewChange,
  gridView,
  portfolioView,
}: TracksViewToggleProps) {
  const [activeView, setActiveView] = useState<"grid" | "portfolio">(defaultView);

  const handleViewChange = (view: "grid" | "portfolio") => {
    setActiveView(view);
    onViewChange?.(view);
  };

  return (
    <div>
      {/* View Toggle */}
      <div className="border-b-2 border-neutral-200 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange("grid")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-bold text-sm whitespace-nowrap transition-all duration-150 ease-out border-b-2 -mb-0.5",
              activeView === "grid"
                ? "text-purple-600 border-purple-600"
                : "text-black/40 border-transparent hover:text-black/60 hover:border-black/20"
            )}
          >
            <Grid3x3 className="h-4 w-4" />
            My Tracks
          </button>

          <button
            onClick={() => handleViewChange("portfolio")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-bold text-sm whitespace-nowrap transition-all duration-150 ease-out border-b-2 -mb-0.5",
              activeView === "portfolio"
                ? "text-purple-600 border-purple-600"
                : "text-black/40 border-transparent hover:text-black/60 hover:border-black/20"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Portfolio
            {!isPro && (
              <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded ml-1">
                PRO
              </span>
            )}
          </button>
        </div>
      </div>

      {/* View Content */}
      <div>
        {activeView === "grid" && gridView}
        {activeView === "portfolio" && portfolioView}
      </div>
    </div>
  );
}
