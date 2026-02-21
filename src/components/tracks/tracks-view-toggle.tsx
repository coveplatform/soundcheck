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
      {/* View Toggle */}
      <div className="border-b-2 border-neutral-200 mb-8">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleViewChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 font-bold text-sm whitespace-nowrap transition-all duration-150 ease-out border-b-2 -mb-0.5",
                activeView === tab.id
                  ? "text-purple-600 border-purple-600"
                  : "text-black/40 border-transparent hover:text-black/60 hover:border-black/20"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
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
