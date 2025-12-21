"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Music, LayoutDashboard, Upload, Headphones, DollarSign, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  const artistLinks = [
    { href: "/artist/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/artist/submit", label: "Submit Track", icon: Upload },
    { href: "/artist/reviewers", label: "Reviewers", icon: Headphones },
  ];

  const reviewerLinks = [
    { href: "/reviewer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reviewer/queue", label: "Review Queue", icon: Headphones },
    { href: "/reviewer/earnings", label: "Earnings", icon: DollarSign },
  ];

  const isArtistPath = pathname.startsWith("/artist");
  const isReviewerPath = pathname.startsWith("/reviewer");

  const links = isArtistPath ? artistLinks : isReviewerPath ? reviewerLinks : [];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">SoundCheck</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {user.isArtist && user.isReviewer && (
              <>
                <Link
                  href="/artist/dashboard"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isArtistPath
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  Artist
                </Link>
                <Link
                  href="/reviewer/dashboard"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isReviewerPath
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  Reviewer
                </Link>
                <div className="w-px h-6 bg-neutral-200 mx-2" />
              </>
            )}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  pathname === link.href
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">{user.name || user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-neutral-500"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
