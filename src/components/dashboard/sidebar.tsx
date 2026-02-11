"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  Home,
  Music,
  Upload,
  Headphones,
  DollarSign,
  Settings,
  LogOut,
  Coins,
  History,
  MoreHorizontal,
  X,
  Compass,
} from "lucide-react";

interface SidebarProps {
  artistName: string;
  credits: number;
  isPro: boolean;
  pendingReviews: number;
}

export function Sidebar({ artistName, credits, isPro, pendingReviews }: SidebarProps) {
  const pathname = usePathname();

  const mainLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/tracks", label: "My Tracks", icon: Music },
    { href: "/submit", label: "Submit Track", icon: Upload },
  ];

  const reviewLinks = [
    {
      href: "/review",
      label: "Review Queue",
      icon: Headphones,
      badge: pendingReviews > 0 ? pendingReviews : undefined,
    },
    { href: "/review/history", label: "Review History", icon: History },
  ];

  const proLinks = [
    { href: "/business", label: "Business", icon: DollarSign, proOnly: true },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const NavLink = ({
    href,
    label,
    icon: Icon,
    badge,
    proOnly,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    proOnly?: boolean;
  }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors border-l-2",
        isActive(href)
          ? "text-black font-medium border-purple-600"
          : "text-neutral-600 border-transparent hover:text-black hover:border-purple-300"
      )}
    >
      <Icon className="w-4 h-4 opacity-70" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-lime-100 text-lime-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {proOnly && !isPro && (
        <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
          PRO
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#faf8f5] border-r border-black/10 flex-col z-40 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Logo />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {mainLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>

          <div className="my-4 border-t border-black/8" />

          <p className="px-4 mb-2 text-[10px] font-mono tracking-widest text-black/35 uppercase">
            Reviews
          </p>
          <div className="space-y-1">
            {reviewLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>

          {proLinks.length > 0 && (
            <>
              <div className="my-4 border-t border-black/8" />

              <p className="px-4 mb-2 text-[10px] font-mono tracking-widest text-black/35 uppercase">
                Business
              </p>
              <div className="space-y-1">
                {proLinks.map((link) => (
                  <NavLink key={link.href} {...link} />
                ))}
              </div>
            </>
          )}

          <div className="my-4 border-t border-black/8" />

          <p className="px-4 mb-2 text-[10px] font-mono tracking-widest text-black/35 uppercase">
            Explore
          </p>
          <div className="group relative">
            <div
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-neutral-400 cursor-default border-l-2 border-transparent"
            >
              <Compass className="w-4 h-4 opacity-50" />
              <span className="flex-1">Discover</span>
              <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                SOON
              </span>
            </div>
            <div className="absolute bottom-full left-4 mb-2 w-52 p-3 bg-white rounded-xl border border-neutral-200 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 ease-out z-50">
              <p className="text-xs font-semibold text-black mb-1">Discover Music</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Browse tracks from the community, listen to new music, purchase songs, and share affiliate links to earn.
              </p>
            </div>
          </div>
        </nav>

        {/* Credit Balance */}
        <div className="px-4 py-3 border-t border-black/10">
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">{credits} credits</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Link
                href="/review"
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Earn more
              </Link>
              <span className="text-purple-300">|</span>
              {isPro ? (
                <Link
                  href="/account"
                  className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  Manage Pro
                </Link>
              ) : (
                <Link
                  href="/account"
                  className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  Get Pro
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/10 space-y-4">
          <div className="px-4">
            <p className="text-xs text-neutral-500 mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate">{artistName}</p>
            {isPro && (
              <span className="inline-block mt-1 text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                PRO
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Link
              href="/account"
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors border-l-2",
                isActive("/account")
                  ? "text-black border-purple-600"
                  : "text-neutral-600 border-transparent hover:text-black hover:border-purple-300"
              )}
            >
              <Settings className="w-4 h-4 opacity-70" />
              Settings
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-600 hover:text-black transition-colors border-l-2 border-transparent hover:border-purple-300"
            >
              <LogOut className="w-4 h-4 opacity-70" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <MobileBottomNav
        isActive={isActive}
        pendingReviews={pendingReviews}
        isPro={isPro}
      />
    </>
  );
}

function MobileBottomNav({
  isActive,
  pendingReviews,
  isPro,
}: {
  isActive: (href: string) => boolean;
  pendingReviews: number;
  isPro: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Close menu on route change
  const pathname = usePathname();
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const primaryLinks = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/tracks", label: "Tracks", icon: Music },
    { href: "/submit", label: "Submit", icon: Upload },
    { href: "/review", label: "Review", icon: Headphones },
  ];

  const moreLinks = [
    { href: "/business", label: "Business", icon: DollarSign, proOnly: true },
    { href: "/reviewer/earnings", label: "Earnings", icon: Coins },
    { href: "/review/history", label: "Review History", icon: History },
    { href: "/account", label: "Settings", icon: Settings },
  ];

  const comingSoonLinks = [
    { label: "Discover", icon: Compass, description: "Browse, listen & share music" },
  ];

  const moreIsActive = moreLinks.some((l) => isActive(l.href));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200">
      <div className="flex items-center justify-around py-3 px-2">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-150 ease-out min-w-0 active:scale-[0.92] active:bg-black/5",
                isActive(link.href) ? "text-purple-600" : "text-neutral-400"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5 flex-shrink-0" />
                {link.href === "/review" && pendingReviews > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lime-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {pendingReviews}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium truncate max-w-full">
                {link.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-150 ease-out min-w-0 active:scale-[0.92] active:bg-black/5",
              moreOpen || moreIsActive ? "text-purple-600" : "text-neutral-400"
            )}
          >
            {moreOpen ? (
              <X className="w-5 h-5 flex-shrink-0" />
            ) : (
              <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-[10px] font-medium">More</span>
          </button>

          {/* Popover menu */}
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl border border-neutral-200 shadow-lg py-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {moreLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      isActive(link.href)
                        ? "text-purple-600 font-medium bg-purple-50"
                        : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <Icon className="w-4 h-4 opacity-70 flex-shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    {link.proOnly && !isPro && (
                      <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="my-1 border-t border-neutral-100" />
              {comingSoonLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <div
                    key={link.label}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-400 cursor-default"
                  >
                    <Icon className="w-4 h-4 opacity-50 flex-shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      SOON
                    </span>
                  </div>
                );
              })}
              <div className="my-1 border-t border-neutral-100" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <LogOut className="w-4 h-4 opacity-70 flex-shrink-0" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
