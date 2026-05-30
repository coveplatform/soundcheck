"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type TabId = "stats" | "reviews" | "settings" | "abtest";

interface TrackDashboardTabsProps {
  defaultTab?: TabId;
  onTabChange?: (tab: string) => void;
  statsTab?: React.ReactNode;
  reviewsTab?: React.ReactNode;
  settingsTab?: React.ReactNode;
  abTestTab?: React.ReactNode;
  trackTitle?: string;
  isABTest?: boolean;
}

export function TrackDashboardTabs({
  defaultTab = "stats",
  onTabChange,
  statsTab,
  reviewsTab,
  settingsTab,
  abTestTab,
  isABTest = false,
}: TrackDashboardTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const validTabs: TabId[] = ["stats", "reviews", "settings", "abtest"];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : defaultTab;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const tabs: { id: TabId; label: string }[] = [
    ...(isABTest ? [{ id: "abtest" as TabId, label: "Compare" }] : []),
    { id: "stats" as TabId, label: "Stats" },
    { id: "reviews" as TabId, label: "Reviews" },
    { id: "settings" as TabId, label: "Settings" },
  ];

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
                ? tab.id === "abtest" ? "text-purple-600 border-purple-600" : "text-black border-black"
                : "text-black/25 border-transparent hover:text-black/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "abtest" && abTestTab}
        {activeTab === "stats" && statsTab}
        {activeTab === "reviews" && reviewsTab}
        {activeTab === "settings" && settingsTab}
      </div>
    </div>
  );
}
