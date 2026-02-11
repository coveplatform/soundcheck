"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

// Reddit Pixel type definition
type RedditPixelType = {
  (action: "init", pixelId: string): void;
  (action: "track", eventName: string, eventData?: Record<string, unknown>): void;
  callQueue?: unknown[];
};

declare global {
  interface Window {
    rdt?: RedditPixelType;
  }
}

export function RedditPixel() {
  const pixelId = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views on route changes (for client-side navigation)
  useEffect(() => {
    if (pathname && typeof window !== "undefined" && window.rdt) {
      window.rdt("track", "PageVisit");
    }
  }, [pathname, searchParams]);

  if (!pixelId) return null;

  return (
    <Script
      id="reddit-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
rdt('init','${pixelId}', {"optOut":false,"useDecimalCurrencyValues":true});
rdt('track', 'PageVisit');
        `,
      }}
    />
  );
}

/**
 * Track Reddit conversion events from anywhere in the app
 *
 * Standard Reddit Events:
 * - PageVisit: Automatically tracked on page load
 * - ViewContent: User views a product/content page
 * - Search: User performs a search
 * - AddToCart: User adds item to cart
 * - AddToWishlist: User adds to wishlist
 * - Purchase: User completes a purchase
 * - Lead: User submits their info (signup, form submission)
 * - SignUp: User creates an account
 * - Custom: Any custom event
 *
 * @param eventName - The Reddit event name
 * @param eventData - Optional event data (itemCount, value, currency, etc.)
 */
export function trackRedditEvent(
  eventName: string,
  eventData?: {
    currency?: string;
    value?: number;
    itemCount?: number;
    transactionId?: string;
    customEventName?: string;
    [key: string]: unknown;
  }
) {
  if (typeof window !== "undefined" && window.rdt) {
    window.rdt("track", eventName, eventData);
  }
}

/**
 * Pre-configured Reddit conversion events for MixReflect funnel
 */
export const redditEvents = {
  // User views the get-feedback landing page
  viewFeedbackPage: () => {
    trackRedditEvent("ViewContent", {
      customEventName: "ViewFeedbackPage",
    });
  },

  viewTrialLandingPage: () => {
    trackRedditEvent("ViewContent", {
      customEventName: "ViewTrialLandingPage",
    });
  },

  // User starts the submission process (has a track ready)
  startSubmission: () => {
    trackRedditEvent("Lead", {
      customEventName: "StartSubmission",
    });
  },

  // User signs up for an account
  signUp: () => {
    trackRedditEvent("SignUp");
  },

  // User initiates checkout (selected package)
  initiateCheckout: (packageType: string, amount: number) => {
    trackRedditEvent("AddToCart", {
      currency: "USD",
      value: amount / 100, // Convert cents to dollars
      itemCount: 1,
      customEventName: `Checkout_${packageType}`,
    });
  },

  // User completes purchase
  purchase: (packageType: string, amount: number, transactionId?: string) => {
    trackRedditEvent("Purchase", {
      currency: "USD",
      value: amount / 100, // Convert cents to dollars
      itemCount: 1,
      transactionId,
      customEventName: `Purchase_${packageType}`,
    });
  },
};
