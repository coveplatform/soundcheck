"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "stats" as const, label: "Stats" },
  { id: "reviews" as const, label: "Reviews" },
  { id: "settings" as const, label: "Settings" },
];

interface TrackDashboardTabsProps {
  defaultTab?: "stats" | "reviews" | "settings";
  onTabChange?: (tab: string) => void;
  statsTab?: React.ReactNode;
  reviewsTab?: React.ReactNode;
  settingsTab?: React.ReactNode;
  trackTitle?: string;
}

export function TrackDashboardTabs({
  defaultTab = "stats",
  onTabChange,
  statsTab,
  reviewsTab,
  settingsTab,
}: TrackDashboardTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "stats" | "reviews" | "settings" | null;
  const validTabs: Array<"stats" | "reviews" | "settings"> = ["stats", "reviews", "settings"];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : defaultTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as "stats" | "reviews" | "settings");
    onTabChange?.(tabId);
  };

  return (
    <div>
      {/* Editorial tab nav — underline style */}
      <div className="flex items-end border-b border-black/15 mb-10 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 pb-3 pt-1 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-150 border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-black border-black"
                : "text-black/25 border-transparent hover:text-black/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "stats" && statsTab}
        {activeTab === "reviews" && reviewsTab}
        {activeTab === "settings" && settingsTab}
      </div>
    </div>
  );
}
