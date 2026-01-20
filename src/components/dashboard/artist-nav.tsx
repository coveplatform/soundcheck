"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ArtistNavProps {
  user: {
    name?: string | null;
    email: string;
    isReviewer: boolean;
  };
  artistName: string;
  hasEarnings?: boolean;
}

export function ArtistNav({ user, artistName, hasEarnings = false }: ArtistNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinks = [
    { href: "/artist/dashboard", label: "Home" },
    { href: "/artist/tracks", label: "Your Tracks" },
    { href: "/discover", label: "Discover" },
    ...(hasEarnings ? [{ href: "/artist/earnings", label: "Earnings" }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Menu trigger */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="fixed top-5 left-5 z-40 p-2 hover:bg-black/5 rounded-full transition-colors"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/60">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Full-screen menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-[#faf8f5]" />

        <div className="relative h-full flex flex-col">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 left-5 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/60">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Main nav */}
          <nav className="flex-1 flex items-center justify-center px-8">
            <div className="space-y-1 sm:space-y-2">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="group block overflow-hidden"
                >
                  <div
                    className={cn(
                      "transform transition-transform duration-500",
                      menuOpen ? "translate-y-0" : "translate-y-full"
                    )}
                    style={{ transitionDelay: menuOpen ? `${i * 75}ms` : "0ms" }}
                  >
                    <span
                      className={cn(
                        "block text-[12vw] sm:text-[10vw] md:text-[8vw] leading-[1.1] font-light tracking-tight transition-colors duration-200",
                        isActive(link.href)
                          ? "text-black"
                          : "text-black/20 group-hover:text-black"
                      )}
                    >
                      {link.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom bar */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-black/40 mb-1">Signed in as</p>
                <p className="text-xl font-light">{artistName}</p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link
                  href="/artist/account"
                  onClick={() => setMenuOpen(false)}
                  className="text-black/50 hover:text-black transition-colors"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="text-black/50 hover:text-black transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>

            {user.isReviewer && (
              <Link
                href="/listener/dashboard"
                onClick={() => setMenuOpen(false)}
                className="group inline-flex items-center gap-3 px-5 py-3 rounded-full border border-black/10 hover:border-black/30 hover:bg-black/5 transition-all"
              >
                <span className="text-sm text-black/70 group-hover:text-black">Switch to Listener</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-black/40 group-hover:text-black transition-colors">
                  <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f5]/90 backdrop-blur-sm border-t border-black/5">
        <div className="flex items-center justify-around py-4 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors",
                isActive(link.href) ? "text-black" : "text-black/40"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
