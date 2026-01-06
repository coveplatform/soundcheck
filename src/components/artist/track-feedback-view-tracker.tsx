"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

export function TrackFeedbackViewTracker({
  trackId,
  reviewCount,
}: {
  trackId: string;
  reviewCount: number;
}) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    if (!trackId) return;
    sentRef.current = true;
    track("artist_track_feedback_viewed", { trackId, reviewCount });
  }, [trackId, reviewCount]);

  return null;
}
