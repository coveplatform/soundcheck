"use client";

import { useEffect, useState } from "react";
import { Moon, X } from "lucide-react";
import { useDashboardTheme } from "./theme-provider";

const DISMISS_KEY = "mr-darkmode-default-banner-dismissed";

/**
 * One-time announcement that dark mode is now the dashboard default. Gives users
 * a one-click escape hatch back to light via the shared theme context, and notes
 * the sidebar toggle. Dismissal persists in localStorage. Renders nothing on the
 * server to avoid a hydration mismatch.
 */
export function DarkModeBanner() {
  const { theme, toggle } = useDashboardTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setVisible(false);
  };

  const switchToLight = () => {
    if (theme === "dark") toggle();
    dismiss();
  };

  if (!visible) return null;

  return (
    <>
      {/* Fixed (not CSS-sticky: html/body have overflow-x:hidden which breaks
          position:sticky). Offset by the sidebar width on desktop. The spacer
          below reserves its height so page content isn't hidden underneath. */}
      <div className="fixed left-0 right-0 top-0 z-30 border-b border-purple-300/60 bg-[#f1e9ffe6] backdrop-blur-md md:left-64 dark:border-purple-400/25 dark:bg-[#1b1531e6]">
        <div className="relative flex items-center gap-3 overflow-hidden px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Decorative purple glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-24 h-28 w-52 rounded-full bg-purple-500/25 blur-2xl"
          />

          {/* Icon */}
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-sm shadow-purple-600/40">
            <Moon className="h-3.5 w-3.5" />
          </div>

          {/* Copy */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[13px] font-black text-black dark:text-white">
              Dark Mode is now the default
            </span>
            <span className="flex-shrink-0 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              New
            </span>
            <span className="hidden truncate text-[13px] text-neutral-600 lg:inline dark:text-neutral-300">
              We&apos;ve switched MixReflect to dark. Prefer light? Switch anytime from the sidebar.
            </span>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={switchToLight}
            className="flex-shrink-0 rounded-lg bg-purple-600 px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm shadow-purple-600/30 transition-colors hover:bg-purple-700"
          >
            {theme === "dark" ? "Use light mode" : "Got it"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reserve the fixed bar's height (single-line, so ~52px). */}
      <div aria-hidden className="h-[52px]" />
    </>
  );
}
