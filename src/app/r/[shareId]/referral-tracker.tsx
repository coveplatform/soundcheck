"use client";

import { useEffect } from "react";
import { setReferralCookie } from "@/lib/referral";

interface ReferralTrackerProps {
  reviewerId: string;
  shareId: string;
  trackId: string;
}

export function ReferralTracker({ reviewerId, shareId, trackId }: ReferralTrackerProps) {
  useEffect(() => {
    setReferralCookie({
      reviewerId,
      shareId,
      trackId,
      timestamp: Date.now(),
    });
  }, [reviewerId, shareId, trackId]);

  return null;
}
