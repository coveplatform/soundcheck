"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  MessageSquare,
  DollarSign,
  Settings
} from "lucide-react";

interface Tab {
  id: "stats" | "reviews" | "sales" | "settings";
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "reviews", label: "Reviews", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "sales", label: "Sales & Earnings", icon: <DollarSign className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

interface TrackDashboardTabsProps {
  defaultTab?: "stats" | "reviews" | "sales" | "settings";
  onTabChange?: (tab: string) => void;
  statsTab?: React.ReactNode;
  reviewsTab?: React.ReactNode;
  salesTab?: React.ReactNode;
  settingsTab?: React.ReactNode;
  isPro?: boolean;
}

export function TrackDashboardTabs({
  defaultTab = "stats",
  onTabChange,
  statsTab,
  reviewsTab,
  salesTab,
  settingsTab,
  isPro = false
}: TrackDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as "stats" | "reviews" | "sales" | "settings");
    onTabChange?.(tabId);
  };

  // Filter tabs based on pro status
  const visibleTabs = tabs.filter(tab => {
    // Sales tab only for pro users
    if (tab.id === "sales" && !isPro) return false;
    return true;
  });

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b-2 border-neutral-200 mb-8 -mx-6 px-6 sm:-mx-8 sm:px-8">
        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 font-bold text-sm whitespace-nowrap transition-all duration-150 ease-out border-b-2 -mb-0.5",
                activeTab === tab.id
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

      {/* Tab Content */}
      <div>
        {activeTab === "stats" && statsTab}
        {activeTab === "reviews" && reviewsTab}
        {activeTab === "sales" && salesTab}
        {activeTab === "settings" && settingsTab}
      </div>
    </div>
  );
}
