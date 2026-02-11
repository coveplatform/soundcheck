"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Music, LayoutDashboard, Upload, Headphones, DollarSign, LogOut, User, Clock, ArrowRight, ChevronDown, Settings, LifeBuoy, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useEffect, useRef, useState } from "react";

export interface DashboardNavProps {
  user: {
    name?: string | null;
    email: string;
    isArtist: boolean;
    isReviewer: boolean;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
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
    { href: "/artist/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/artist/tracks", label: "Tracks", icon: Music },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/artist/submit", label: "Upload", icon: Upload },
  ];

  const listenerLinks = [
    { href: "/listener/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/listener/queue", label: "Listening Queue", icon: Headphones },
    { href: "/listener/history", label: "History", icon: Clock },
    { href: "/listener/earnings", label: "Earnings", icon: DollarSign },
  ];

  const isArtistPath = pathname.startsWith("/artist");
  const isListenerPath = pathname.startsWith("/listener");
  const isLegacyReviewerPath = pathname.startsWith("/reviewer");
  const isListenerOnboarding = pathname === "/listener/onboarding";

  const currentSection = isArtistPath
    ? "artist"
    : isListenerPath || isLegacyReviewerPath
      ? "listener"
      : null;

  // Don't show listener nav links if user isn't actually a reviewer (e.g., on onboarding)
  // Only show links if they have the corresponding role
  const links = isArtistPath
    ? artistLinks
    : ((isListenerPath || isLegacyReviewerPath) && user.isReviewer && !isListenerOnboarding)
      ? listenerLinks
      : [];

  const accountHref = isArtistPath
    ? "/artist/account"
    : isListenerPath || isLegacyReviewerPath
    ? "/listener/account"
    : "/account";

  const sectionConfig = {
    artist: {
      label: "Artist",
      color: "bg-lime-500",
      hoverColor: "hover:bg-lime-400",
      textColor: "text-black",
      icon: Music,
      switchTo: {
        href: user.isReviewer ? "/listener/dashboard" : "/listener/onboarding",
        label: user.isReviewer ? "Listener" : "Become Listener",
      },
    },
    listener: {
      label: "Listener",
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

  // Don't show section bar on listener onboarding if user isn't a reviewer
  const showShell = currentSection && !(isListenerOnboarding && !user.isReviewer);
  const config = showShell ? sectionConfig[currentSection] : null;

  const indexAccentClass =
    isArtistPath ? "bg-lime-500" : isListenerPath || isLegacyReviewerPath ? "bg-orange-400" : "bg-black";

  const primaryCtaHref = isArtistPath
    ? "/artist/submit"
    : isListenerPath || isLegacyReviewerPath
    ? "/listener/queue"
    : null;

  const primaryCtaLabel =
    isArtistPath
      ? "Submit track"
      : isListenerPath || isLegacyReviewerPath
        ? "Listening queue"
        : "Continue";

  const mobileTabs = isArtistPath
    ? [
        { href: "/artist/dashboard", label: "Home", icon: LayoutDashboard },
        { href: "/artist/tracks", label: "Tracks", icon: Music },
        { href: "/discover", label: "Discover", icon: Compass },
        { href: "/artist/submit", label: "Submit", icon: Upload },
        { href: "/artist/reviewers", label: "Listeners", icon: Headphones },
        { href: accountHref, label: "Account", icon: User },
      ]
    : isListenerPath || isLegacyReviewerPath
    ? [
        { href: "/listener/queue", label: "Queue", icon: Headphones },
        { href: "/listener/dashboard", label: "Home", icon: LayoutDashboard },
        { href: "/listener/history", label: "History", icon: Clock },
        { href: "/listener/earnings", label: "Earnings", icon: DollarSign },
        { href: accountHref, label: "Account", icon: User },
      ]
    : [];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#faf8f5]/92 backdrop-blur border-b border-black/10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="h-20 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/" className="flex items-center gap-2">
                <Logo />
              </Link>
              {config ? (
                <span className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-black/50">
                  <span className={cn("h-2 w-2 rounded-full", indexAccentClass)} />
                  {config.label}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3" ref={userMenuRef}>
              {primaryCtaHref ? (
                <Link href={primaryCtaHref} className="hidden sm:inline-flex">
                  <Button size="sm" variant="primary">
                    {primaryCtaLabel}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : null}

              <div className="hidden md:flex flex-col items-end mr-3">
                <p className="text-[10px] text-black/40 uppercase tracking-wider font-mono">Signed in as</p>
                <p className="text-sm font-bold text-black truncate max-w-[200px]">{user.name || user.email}</p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-black/70 hover:bg-black/5 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <User className="h-4 w-4 text-black/50" />
                  <span className="md:hidden truncate max-w-[160px]">{user.name || user.email}</span>
                  <ChevronDown className="h-4 w-4 text-black/50" />
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] z-50 rounded-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-black/10">
                      <p className="text-xs text-neutral-500 font-mono">Signed in as</p>
                      <p className="text-sm font-bold text-black truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        href={accountHref}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-black rounded-xl hover:bg-black/5 transition-colors duration-150 ease-out motion-reduce:transition-none"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        Account settings
                      </Link>
                      <Link
                        href="/support"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-black rounded-xl hover:bg-black/5 transition-colors duration-150 ease-out motion-reduce:transition-none"
                        role="menuitem"
                      >
                        <LifeBuoy className="h-4 w-4" />
                        Support
                      </Link>
                      {config ? (
                        <Link
                          href={config.switchTo.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm font-bold text-black rounded-xl hover:bg-black/5 transition-colors duration-150 ease-out motion-reduce:transition-none"
                          role="menuitem"
                        >
                          <span>Switch to {config.switchTo.label}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                      <div className="h-px bg-black/10 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-bold text-black rounded-xl hover:bg-black/5 transition-colors duration-150 ease-out motion-reduce:transition-none"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {links.length > 0 ? (
        <aside className="hidden md:block fixed left-0 top-20 w-64 lg:w-72 px-6 lg:px-10 py-10">
          <div className="space-y-6">
            {config ? (
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono tracking-widest text-black/50 uppercase">
                  index
                </div>
                <Link
                  href={config.switchTo.href}
                  className="text-xs font-bold text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none"
                >
                  Switch
                </Link>
              </div>
            ) : null}

            <nav className="space-y-3">
              {links.map((link, idx) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group flex items-baseline gap-3",
                      "text-sm font-bold text-black/60 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none"
                    )}
                  >
                    <span className="w-10 text-xs font-mono text-black/35">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="relative">
                      {link.label}
                      {active ? (
                        <span className={cn("absolute -left-4 top-1.5 h-2 w-2 rounded-full", indexAccentClass)} />
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      ) : null}

      {config && mobileTabs.length > 0 ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#faf8f5]/92 backdrop-blur border-t border-black/10">
          <div className="max-w-6xl mx-auto px-2">
            <nav
              className={cn(
                "grid gap-1 py-2",
                mobileTabs.length === 4 ? "grid-cols-4" : mobileTabs.length === 5 ? "grid-cols-5" : "grid-cols-4"
              )}
            >
              {mobileTabs.map((tab) => {
                const active = pathname === tab.href;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition-colors duration-150 ease-out motion-reduce:transition-none",
                      active ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-white" : "text-black/60")} />
                    <span className="leading-none">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
