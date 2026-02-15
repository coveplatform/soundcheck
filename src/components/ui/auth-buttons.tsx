"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuthButtons({
  theme = "light",
}: {
  theme?: "light" | "dark";
} = {}) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  // Preserve referral code in auth links
  const loginUrl = ref ? `/login?ref=${ref}` : "/login";
  const signupUrl = ref ? `/signup?ref=${ref}` : "/signup";

  // Show nothing while loading to avoid layout shift
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 bg-neutral-100 animate-pulse rounded" />
      </div>
    );
  }

  if (session) {
    const user = session.user as { isArtist?: boolean; isReviewer?: boolean } | undefined;
    const dashboardHref = "/dashboard";

    return (
      <Link href={dashboardHref}>
        <Button
          className={
            theme === "dark"
              ? "bg-purple-600 text-white hover:bg-purple-700 font-medium border-2 border-purple-600"
              : "bg-black text-white hover:bg-neutral-800 font-medium"
          }
        >
          Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href={loginUrl}>
        <Button
          variant="ghost"
          className={theme === "dark" ? "font-medium text-white hover:bg-neutral-900" : "font-medium"}
        >
          Sign in
        </Button>
      </Link>
      <Link href={signupUrl}>
        <Button
          className={
            theme === "dark"
              ? "bg-purple-600 text-white hover:bg-purple-700 font-medium border-2 border-purple-600"
              : "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out"
          }
        >
          Get Started
        </Button>
      </Link>
    </>
  );
}
