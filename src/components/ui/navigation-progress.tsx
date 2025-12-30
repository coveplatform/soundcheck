"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset when navigation completes
    setIsNavigating(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isNavigating) {
      // Animate progress bar
      setProgress(10);
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slow down as we approach 90%
          const increment = Math.max(1, (90 - prev) / 10);
          return Math.min(90, prev + increment);
        });
      }, 100);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isNavigating]);

  // Listen for navigation start via click events on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, and same-page links
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.target === "_blank"
      ) {
        return;
      }

      // Skip if it's the current page
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      if (href === currentPath || href === pathname) {
        return;
      }

      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-lime-500 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(163,230,53,0.7)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
