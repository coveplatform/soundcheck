"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  const { data: session, status } = useSession();

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
    const dashboardHref = user?.isArtist
      ? "/artist/dashboard"
      : user?.isReviewer
        ? "/reviewer/dashboard"
        : "/artist/onboarding";

    return (
      <Link href={dashboardHref}>
        <Button className="bg-black text-white hover:bg-neutral-800 font-medium">
          Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/login">
        <Button variant="ghost" className="font-medium">Sign in</Button>
      </Link>
      <Link href="/signup">
        <Button className="bg-black text-white hover:bg-neutral-800 font-medium">
          Get Started
        </Button>
      </Link>
    </>
  );
}
