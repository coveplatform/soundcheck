"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { JetBrains_Mono } from "next/font/google";
import { useAuthModal } from "@/components/providers";
import { Logo } from "@/components/ui/logo";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

/**
 * Shared public-site nav — the new dark MixReflect (Score) header.
 * Mirrors the homepage header so content pages (e.g. /today) sit on the same
 * brand. Section links point back to the homepage; the auth buttons open the
 * shared auth modal (provided app-wide by <Providers>).
 */
export function SiteNav() {
  const { data: session } = useSession();
  const { open: openAuth } = useAuthModal();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
        </Link>

        <nav
          className={`${mono.className} hidden md:flex items-center gap-7 text-[13px] text-white/55 lowercase`}
        >
          <Link href="/today" className="hover:text-white transition-colors">track of the day</Link>
          <Link href="/#how" className="hover:text-white transition-colors">how it works</Link>
          <Link href="/#pricing" className="hover:text-white transition-colors">pricing</Link>
          <Link href="/blog" className="hover:text-white transition-colors">the drop</Link>
        </nav>

        <div className={`${mono.className} flex items-center gap-4 text-[13px] shrink-0 lowercase`}>
          {session ? (
            <Link
              href="/dashboard"
              className="bg-[#6ee7ff] text-black font-bold px-4 py-1.5 hover:bg-white transition-colors"
            >
              dashboard
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("signin")}
                className="hidden sm:inline text-white/55 hover:text-white transition-colors"
              >
                log in
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="bg-[#6ee7ff] text-black font-bold px-4 py-1.5 hover:bg-white transition-colors"
              >
                sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
