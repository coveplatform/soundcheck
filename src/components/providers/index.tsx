"use client";

import { ReactNode, Suspense } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ClarityScript } from "./clarity-script";
import { TikTokPixel } from "./tiktok-pixel";
import { RedditPixel } from "./reddit-pixel";
import { CookieConsentProvider } from "./cookie-consent";
import { NavigationProgress } from "@/components/ui/navigation-progress";

export function Providers({ children, requiresConsent = false }: { children: ReactNode; requiresConsent?: boolean }) {
  return (
    <NextAuthSessionProvider>
      <CookieConsentProvider requiresConsent={requiresConsent}>
        <Suspense fallback={null}>
          <NavigationProgress />
          <ClarityScript />
          <TikTokPixel />
          <RedditPixel />
          {children}
        </Suspense>
      </CookieConsentProvider>
    </NextAuthSessionProvider>
  );
}

// Re-export individual providers for flexibility
export { ClarityScript } from "./clarity-script";
export { TikTokPixel, trackTikTokEvent } from "./tiktok-pixel";
export { RedditPixel, trackRedditEvent, redditEvents } from "./reddit-pixel";
export { useCookieConsent } from "./cookie-consent";
