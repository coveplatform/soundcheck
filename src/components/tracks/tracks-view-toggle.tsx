"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Layers, Grid3x3, TableProperties, BarChart3 } from "lucide-react";

type ViewType = "queue" | "grid" | "stats" | "insights";

interface TracksViewToggleProps {
  defaultView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  queueView?: React.ReactNode;
  gridView: React.ReactNode;
  statsView?: React.ReactNode;
  insightsView: React.ReactNode;
}

export function TracksViewToggle({
  defaultView = "queue",
  onViewChange,
  queueView,
  gridView,
  statsView,
  insightsView,
}: TracksViewToggleProps) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") as ViewType | null;
  const initialView: ViewType =
    viewParam === "insights" ? "insights" :
    viewParam === "stats" ? "stats" :
    viewParam === "grid" ? "grid" :
    defaultView;
  const [activeView, setActiveView] = useState<ViewType>(initialView);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const tabs: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    ...(queueView ? [{ id: "queue" as ViewType, label: "Queue", icon: <Layers className="h-4 w-4" /> }] : []),
    { id: "grid", label: "Library", icon: <Grid3x3 className="h-4 w-4" /> },
    ...(statsView ? [{ id: "stats" as ViewType, label: "Stats", icon: <TableProperties className="h-4 w-4" /> }] : []),
    { id: "insights", label: "Insights", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleViewChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider whitespace-nowrap transition-all duration-150 border-2",
              activeView === tab.id
                ? "bg-black text-white border-black"
                : "bg-white text-black/40 border-black/10 hover:border-black/25 hover:text-black/70"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div>
        {activeView === "queue" && queueView}
        {activeView === "grid" && gridView}
        {activeView === "stats" && statsView}
        {activeView === "insights" && insightsView}
      </div>
    </div>
  );
}
