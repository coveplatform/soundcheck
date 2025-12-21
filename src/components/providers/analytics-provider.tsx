"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { initAnalytics, identifyUser, resetUser, posthog } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Initialize PostHog
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  // Identify user when session changes
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      identifyUser(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        isArtist: session.user.isArtist,
        isReviewer: session.user.isReviewer,
        artistProfileId: session.user.artistProfileId,
        reviewerProfileId: session.user.reviewerProfileId,
      });
    } else {
      resetUser();
    }
  }, [session, status]);

  return <>{children}</>;
}
