"use client";

import { ReactNode, Suspense } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { AnalyticsProvider } from "./analytics-provider";
import { ClarityScript } from "./clarity-script";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <Suspense fallback={null}>
        <AnalyticsProvider>
          <ClarityScript />
          {children}
        </AnalyticsProvider>
      </Suspense>
    </NextAuthSessionProvider>
  );
}

// Re-export individual providers for flexibility
export { AnalyticsProvider } from "./analytics-provider";
export { ClarityScript } from "./clarity-script";
