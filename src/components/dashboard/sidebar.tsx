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
  Headphones,
  Settings,
  LogOut,
  Coins,
  History,
  MoreHorizontal,
  X,
  LifeBuoy,
  BarChart3,
  Crown,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  artistName: string;
  credits: number;
  pendingReviews: number;
  isPro?: boolean;
}

export function Sidebar({ artistName, credits, pendingReviews, isPro }: SidebarProps) {
  const pathname = usePathname();

  const mainLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/charts", label: "Track of the Day", icon: TrendingUp, comingSoon: true },
    { href: "/tracks", label: "My Tracks", icon: Music },
    { href: "/tracks?view=insights", label: "Insights", icon: BarChart3 },
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


  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const NavLink = ({
    href,
    label,
    icon: Icon,
    badge,
    isNew,
    comingSoon,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isNew?: boolean;
    comingSoon?: boolean;
  }) => {
    const inner = (
      <>
        <Icon className="w-4 h-4 opacity-70" />
        <span className="flex-1">{label}</span>
        {badge !== undefined && (
          <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {isNew && (
          <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            New
          </span>
        )}
        {comingSoon && (
          <span className="bg-neutral-200 text-neutral-500 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            Soon
          </span>
        )}
      </>
    );

    if (comingSoon) {
      return (
        <ComingSoonNavItem inner={inner} />
      );
    }

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors border-l-2",
          isActive(href)
            ? "text-black font-medium border-purple-600"
            : "text-neutral-600 border-transparent hover:text-black hover:border-purple-300"
        )}
      >
        {inner}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#faf8f5] border-r border-black/10 flex-col z-40">
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


        </nav>

        {/* Credit Balance + Pro */}
        <div className="px-4 py-3 border-t border-black/10 space-y-2">
          {/* Credits */}
          <div className={`rounded-xl p-3 ${credits === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-purple-50'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Coins className={`w-4 h-4 ${credits === 0 ? 'text-amber-600' : 'text-purple-600'}`} />
              <span className={`text-lg font-bold tabular-nums ${credits === 0 ? 'text-amber-900' : 'text-purple-900'}`}>{credits}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${credits === 0 ? 'text-amber-600/60' : 'text-purple-600/60'}`}>credits</span>
            </div>
            <Link
              href="/review"
              className={`text-[11px] font-medium transition-colors ${credits === 0 ? 'text-amber-700 hover:text-amber-900' : 'text-purple-600 hover:text-purple-800'}`}
            >
              {credits === 0 ? 'Earn credits by reviewing' : 'Earn more by reviewing'}
            </Link>
          </div>

          {/* Pro badge or upsell */}
          {isPro ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-100">
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-bold text-purple-700">Pro</span>
            </div>
          ) : (
            <Link
              href="/pro"
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-purple-500 group-hover:text-purple-600 transition-colors" />
              <span className="text-xs font-semibold text-purple-700 flex-1">Upgrade to Pro</span>
              <ArrowRight className="w-3 h-3 text-purple-400 group-hover:text-purple-600 transition-colors" />
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/10 space-y-4">
          <div className="px-4">
            <p className="text-xs text-neutral-500 mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate">{artistName}</p>
          </div>

          <div className="space-y-1">
            <Link
              href="/support"
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors border-l-2",
                isActive("/support")
                  ? "text-black border-purple-600"
                  : "text-neutral-600 border-transparent hover:text-black hover:border-purple-300"
              )}
            >
              <LifeBuoy className="w-4 h-4 opacity-70" />
              Support
            </Link>

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
      />
    </>
  );
}

function ComingSoonNavItem({ inner }: { inner: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tooltipTop, setTooltipTop] = useState(0);
  const [show, setShow] = useState(false);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipTop(rect.top + rect.height / 2);
    }
    setShow(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 text-[13px] border-l-2 border-transparent text-neutral-400 cursor-not-allowed select-none">
        {inner}
      </div>
      {show && (
        <div
          className="pointer-events-none fixed z-[9999] w-56 rounded-lg bg-neutral-900 text-white text-xs px-3.5 py-2.5 leading-relaxed shadow-xl"
          style={{ left: 264, top: tooltipTop, transform: "translateY(-50%)" }}
        >
          Discover which tracks are getting the most buzz each day. Curated picks from artists in your genre. Coming soon!
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
        </div>
      )}
    </div>
  );
}

function MobileBottomNav({
  isActive,
  pendingReviews,
}: {
  isActive: (href: string) => boolean;
  pendingReviews: number;
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
    { href: "/review", label: "Review", icon: Headphones },
  ];

  const moreLinks = [
    { href: "/charts", label: "Track of the Day", icon: TrendingUp, comingSoon: true },
    { href: "/tracks?view=insights", label: "Insights", icon: BarChart3 },
    { href: "/review/history", label: "Review History", icon: History },
    { href: "/support", label: "Support", icon: LifeBuoy },
    { href: "/account", label: "Settings", icon: Settings },
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
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
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
                if (link.comingSoon) {
                  return (
                    <div
                      key={link.href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-400 cursor-not-allowed select-none"
                    >
                      <Icon className="w-4 h-4 opacity-50 flex-shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      <span className="bg-neutral-200 text-neutral-500 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Soon
                      </span>
                    </div>
                  );
                }
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
                  </Link>
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
