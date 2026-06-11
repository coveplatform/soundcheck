"use client";

import { useEffect } from "react";
import { scoreConversions } from "@/lib/score-conversions";
import type { SubPlan } from "@/lib/score-pricing";

/**
 * Fires the subscription Purchase event to the ad pixels when a page is
 * landed on with `?subscribed=1` (the Stripe success redirect). Renders
 * nothing; dedupes inside the helper, so mounting it on every visit is fine.
 * Used on server-component pages (dashboard) that can't run the effect inline.
 */
export function SubscribeConversionPing() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("subscribed")) return;
    const plan: SubPlan = params.get("plan") === "annual" ? "annual" : "monthly";
    scoreConversions.subscribed(plan);
  }, []);
  return null;
}
