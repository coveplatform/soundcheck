"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Home, Music, Compass, DollarSign, Settings, LogOut, Headphones, BarChart3 } from "lucide-react";

interface ArtistSidebarProps {
  user: {
    name?: string | null;
    email: string;
    isReviewer: boolean;
  };
  artistName: string;
  hasEarnings?: boolean;
}

export function ArtistSidebar({ user, artistName, hasEarnings = false }: ArtistSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/artist/dashboard", label: "Dashboard", icon: Home },
    { href: "/artist/tracks", label: "Tracks", icon: Music },
    { href: "/artist/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/discover", label: "Discover", icon: Compass },
    ...(hasEarnings ? [{ href: "/artist/earnings", label: "Earnings", icon: DollarSign }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#faf8f5] border-r border-black/10 flex-col z-40">
        {/* Header */}
        <div className="p-6 border-b border-black/10">
          <Link href="/artist/dashboard" className="flex items-center gap-2.5">
            <Image src="/icon.svg" alt="MixReflect" width={28} height={28} className="flex-shrink-0" />
            <span className="text-lg font-semibold tracking-tight">MixReflect</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors border-l-2",
                  isActive(link.href)
                    ? "text-black font-medium border-black"
                    : "text-neutral-600 border-transparent hover:text-black hover:border-black/20"
                )}
              >
                <Icon className="w-4 h-4 opacity-70" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-black/10 space-y-4">
          {/* User info */}
          <div className="px-4">
            <p className="text-xs text-neutral-500 mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate">{artistName}</p>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            {user.isReviewer && (
              <div
                title="We aren't accepting listeners at the moment - all spots are full"
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-400 border-l-2 border-transparent cursor-not-allowed opacity-50"
              >
                <Headphones className="w-4 h-4 opacity-40" />
                Switch to Listener
              </div>
            )}

            <Link
              href="/artist/account"
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-600 hover:text-black transition-colors border-l-2 border-transparent hover:border-black/20"
            >
              <Settings className="w-4 h-4 opacity-70" />
              Settings
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-600 hover:text-black transition-colors border-l-2 border-transparent hover:border-black/20"
            >
              <LogOut className="w-4 h-4 opacity-70" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200">
        <div className="flex items-center justify-around py-3 px-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0",
                  isActive(link.href)
                    ? "text-black"
                    : "text-neutral-400"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-full">{link.label}</span>
              </Link>
            );
          })}
          <Link
            href="/artist/account"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0",
              pathname.startsWith("/artist/account")
                ? "text-black"
                : "text-neutral-400"
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
