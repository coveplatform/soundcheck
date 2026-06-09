"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { JetBrains_Mono } from "next/font/google";
import { User, LogOut, Settings } from "lucide-react";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="account"
        className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white/40 transition-colors"
      >
        <User className="h-4 w-4 text-white/70" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-[#101010] border border-white/15 z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <p className={`${mono.className} text-[10px] text-white/40 uppercase tracking-wide`}>
              signed in as
            </p>
            <p className="text-[13px] text-white truncate normal-case mt-0.5">{email}</p>
          </div>
          <Link
            href="/dashboard/settings"
            className={`${mono.className} flex items-center gap-2.5 px-4 py-3 text-[13px] text-white/75 hover:bg-white/5 transition-colors`}
          >
            <Settings className="h-3.5 w-3.5" />
            account settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={`${mono.className} w-full flex items-center gap-2.5 px-4 py-3 text-[13px] hover:bg-white/5 transition-colors`}
            style={{ color: ACCENT }}
          >
            <LogOut className="h-3.5 w-3.5" />
            sign out
          </button>
        </div>
      )}
    </div>
  );
}
