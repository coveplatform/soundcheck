"use client";

import { trackRedditEvent } from "@/components/providers/reddit-pixel";
import { trackTikTokEvent } from "@/components/providers/tiktok-pixel";
import { UNLOCK_PRICE_CENTS, scoreSubPrice, type SubPlan } from "@/lib/score-pricing";

/**
 * Score-funnel conversion events, fired to both ad pixels (Reddit + TikTok)
 * from one call site per conversion:
 *
 *   submitTrack            free submit lands a report        (Lead / SubmitForm)
 *   startUnlockCheckout    unlock CTA → Stripe               (AddToCart / InitiateCheckout)
 *   startSubscribeCheckout subscribe CTA → Stripe            (AddToCart / InitiateCheckout)
 *   unlockPurchased        back from Stripe, ?unlocked=1     (Purchase / CompletePayment)
 *   subscribed             back from Stripe, ?subscribed=1   (Purchase / Subscribe)
 *
 * Purchase events dedupe via localStorage — the Stripe success params stay in
 * the URL across refreshes and the report page reloads itself while the
 * webhook finalizes, so "fire once per transaction" can't rely on mount count.
 */

function firstTime(key: string): boolean {
  try {
    const k = `mr_conv_${key}`;
    if (window.localStorage.getItem(k)) return false;
    window.localStorage.setItem(k, "1");
    return true;
  } catch {
    // storage unavailable (private mode etc.) — better to risk a duplicate
    // than to drop the conversion entirely
    return true;
  }
}

export const scoreConversions = {
  /** A free track submission created a report. */
  submitTrack: (slug?: string) => {
    trackRedditEvent("Lead", { customEventName: "SubmitTrack" });
    trackTikTokEvent("SubmitForm", {
      content_type: "product",
      content_id: slug ?? "score-report",
      content_name: "track score submission",
    });
  },

  /** Unlock CTA clicked — heading to Stripe checkout. */
  startUnlockCheckout: (slug: string) => {
    const value = UNLOCK_PRICE_CENTS / 100;
    trackRedditEvent("AddToCart", {
      currency: "USD",
      value,
      itemCount: 1,
      customEventName: "StartUnlockCheckout",
    });
    trackTikTokEvent("InitiateCheckout", {
      content_type: "product",
      content_id: slug,
      content_name: "full report unlock",
      value,
      currency: "USD",
    });
  },

  /** Unlimited-subscription CTA clicked — heading to Stripe checkout. */
  startSubscribeCheckout: (plan: SubPlan) => {
    const value = scoreSubPrice(plan).amount / 100;
    trackRedditEvent("AddToCart", {
      currency: "USD",
      value,
      itemCount: 1,
      customEventName: `StartSubscribeCheckout_${plan}`,
    });
    trackTikTokEvent("InitiateCheckout", {
      content_type: "product",
      content_id: `unlimited-${plan}`,
      content_name: "unlimited subscription",
      value,
      currency: "USD",
    });
  },

  /** Back from Stripe after a one-time unlock (?unlocked=1). Fires once per report. */
  unlockPurchased: (slug: string) => {
    if (!firstTime(`unlock_${slug}`)) return;
    const value = UNLOCK_PRICE_CENTS / 100;
    trackRedditEvent("Purchase", {
      currency: "USD",
      value,
      itemCount: 1,
      transactionId: `unlock_${slug}`,
    });
    trackTikTokEvent("CompletePayment", {
      content_type: "product",
      content_id: slug,
      content_name: "full report unlock",
      value,
      currency: "USD",
    });
  },

  /** Back from Stripe after subscribing (?subscribed=1). Fires once per browser. */
  subscribed: (plan: SubPlan) => {
    if (!firstTime("subscribe")) return;
    const value = scoreSubPrice(plan).amount / 100;
    trackRedditEvent("Purchase", {
      currency: "USD",
      value,
      itemCount: 1,
      transactionId: `subscribe_${plan}`,
    });
    trackTikTokEvent("Subscribe", {
      content_type: "product",
      content_id: `unlimited-${plan}`,
      content_name: "unlimited subscription",
      value,
      currency: "USD",
    });
  },
};
