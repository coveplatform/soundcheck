"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Music, LayoutDashboard, Upload, Headphones, DollarSign, LogOut, User, Clock, ArrowRight, Menu, X, ChevronDown, Settings, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useEffect, useRef, useState } from "react";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email: string;
    isArtist: boolean;
    isReviewer: boolean;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const el = userMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setUserMenuOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [userMenuOpen]);

  const artistLinks = [
    { href: "/artist/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/artist/submit", label: "Submit Track", icon: Upload },
    { href: "/artist/reviewers", label: "Reviewers", icon: Headphones },
  ];

  const reviewerLinks = [
    { href: "/reviewer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reviewer/queue", label: "Review Queue", icon: Headphones },
    { href: "/reviewer/history", label: "History", icon: Clock },
    { href: "/reviewer/earnings", label: "Earnings", icon: DollarSign },
  ];

  const isArtistPath = pathname.startsWith("/artist");
  const isReviewerPath = pathname.startsWith("/reviewer");

  const currentSection = isArtistPath ? "artist" : isReviewerPath ? "reviewer" : null;
  const links = isArtistPath ? artistLinks : isReviewerPath ? reviewerLinks : [];

  const accountHref = isArtistPath
    ? "/artist/account"
    : isReviewerPath
    ? "/reviewer/account"
    : "/account";

  const sectionConfig = {
    artist: {
      label: "Artist",
      color: "bg-lime-500",
      hoverColor: "hover:bg-lime-400",
      textColor: "text-black",
      icon: Music,
      switchTo: {
        href: user.isReviewer ? "/reviewer/dashboard" : "/reviewer/onboarding",
        label: user.isReviewer ? "Reviewer" : "Become Reviewer",
      },
    },
    reviewer: {
      label: "Reviewer",
      color: "bg-orange-400",
      hoverColor: "hover:bg-orange-300",
      textColor: "text-black",
      icon: Headphones,
      switchTo: {
        href: user.isArtist ? "/artist/dashboard" : "/artist/onboarding",
        label: user.isArtist ? "Artist" : "Become Artist",
      },
    },
  };

  const config = currentSection ? sectionConfig[currentSection] : null;

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar - Logo and user actions */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-3" ref={userMenuRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <User className="h-4 w-4 text-neutral-500" />
                  <span className="hidden sm:inline">{user.name || user.email}</span>
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50"
                  >
                    <div className="px-4 py-3 border-b-2 border-black">
                      <p className="text-xs text-neutral-500 font-mono">Signed in as</p>
                      <p className="text-sm font-bold text-black truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        href={accountHref}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-transparent hover:border-black/20"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        Account settings
                      </Link>
                      <Link
                        href="/support"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-transparent hover:border-black/20"
                        role="menuitem"
                      >
                        <LifeBuoy className="h-4 w-4" />
                        Support
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-transparent hover:border-black/20"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 -mr-2"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section bar - Shows current section prominently */}
      {config && (
        <div className={cn("border-b-2 border-black", config.color)}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-12">
              {/* Current section indicator */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <config.icon className="h-5 w-5" />
                  <span className="font-black text-lg uppercase tracking-wide">
                    {config.label}
                  </span>
                </div>

                {/* Page navigation - Desktop */}
                <nav className="hidden md:flex items-center gap-1">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-3 py-1.5 text-sm font-bold transition-all border-2",
                        pathname === link.href
                          ? "bg-black text-white border-black"
                          : "border-transparent hover:border-black/20"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Switch section - Desktop */}
              <Link
                href={config.switchTo.href}
                className="hidden md:flex items-center gap-1.5 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              >
                <span>{config.switchTo.label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-2 border-black">
          <div className="px-4 py-4 space-y-2">
            {/* Page links */}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-bold border-2 border-black",
                  pathname === link.href
                    ? "bg-black text-white"
                    : "bg-white text-black"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}

            {/* Section switcher */}
            {config && (
              <>
                <div className="border-t-2 border-black my-3" />
                <Link
                  href={config.switchTo.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-neutral-600"
                >
                  <span>Switch to {config.switchTo.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
