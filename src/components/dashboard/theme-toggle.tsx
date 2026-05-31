"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useDashboardTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-600 hover:text-black transition-colors border-l-2 border-transparent hover:border-purple-300",
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 opacity-70" />
      ) : (
        <Moon className="w-4 h-4 opacity-70" />
      )}
      <span className="flex-1 text-left">
        {isDark ? "Light mode" : "Dark mode"}
      </span>
      {/* Track */}
      <span
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          isDark ? "bg-purple-600" : "bg-neutral-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            isDark ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
