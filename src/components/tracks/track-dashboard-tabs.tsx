"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  MessageSquare,
  Settings
} from "lucide-react";
import { PostReviewModal } from "@/components/referral/post-review-modal";

interface Tab {
  id: "stats" | "reviews" | "settings";
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "stats", label: "Track Stats", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "reviews", label: "Reviews", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

interface TrackDashboardTabsProps {
  defaultTab?: "stats" | "reviews" | "settings";
  onTabChange?: (tab: string) => void;
  statsTab?: React.ReactNode;
  reviewsTab?: React.ReactNode;
  settingsTab?: React.ReactNode;
  trackTitle?: string;
  hasCompletedReviews?: boolean;
}

export function TrackDashboardTabs({
  defaultTab = "stats",
  onTabChange,
  statsTab,
  reviewsTab,
  settingsTab,
  trackTitle,
  hasCompletedReviews = false,
}: TrackDashboardTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "stats" | "reviews" | "settings" | null;
  const validTabs: Array<"stats" | "reviews" | "settings"> = ["stats", "reviews", "settings"];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : defaultTab;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Show referral modal when viewing reviews tab with completed reviews
  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("post-review-modal-seen");
    if (activeTab === "reviews" && hasCompletedReviews && !hasSeenModal) {
      setShowReferralModal(true);
      sessionStorage.setItem("post-review-modal-seen", "true");
    }
  }, [activeTab, hasCompletedReviews]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as "stats" | "reviews" | "settings");
    onTabChange?.(tabId);
  };

  return (
    <>
      {showReferralModal && trackTitle && (
        <PostReviewModal
          trackTitle={trackTitle}
          onClose={() => setShowReferralModal(false)}
        />
      )}

      <div>
        {/* Tab Navigation */}
      <div className="border-b-2 border-neutral-200 mb-8 -mx-6 px-6 sm:-mx-8 sm:px-8">
        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
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
        {activeTab === "settings" && settingsTab}
      </div>
    </div>
    </>
  );
}
