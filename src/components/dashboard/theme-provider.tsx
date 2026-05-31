"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DashboardTheme = "light" | "dark";

const ThemeContext = createContext<{
  theme: DashboardTheme;
  toggle: () => void;
}>({
  theme: "light",
  toggle: () => {},
});

export const useDashboardTheme = () => useContext(ThemeContext);

/**
 * Scoped dark mode for the dashboard app only.
 *
 * The `dark` class is applied to a wrapper div (not <html>) so marketing /
 * auth pages — which share the same global utility classes — stay light.
 * The dark palette is defined as a CSS override layer in globals.css, keyed
 * on `.dark`. The initial theme comes from the `mr-theme` cookie read on the
 * server, so the first paint already has the right class (no flash).
 */
export function DashboardThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: DashboardTheme;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<DashboardTheme>(initialTheme);

  // Mirror the class to <html> so Radix portals (dialogs, tooltips, dropdowns)
  // that render to document.body also inherit the dark scope. Clean up on
  // unmount (e.g. navigating to a non-dashboard page).
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => root.classList.remove("dark");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.cookie = `mr-theme=${next}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className={theme === "dark" ? "dark" : undefined}>{children}</div>
    </ThemeContext.Provider>
  );
}
