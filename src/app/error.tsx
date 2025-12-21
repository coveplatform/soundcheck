"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto py-20 text-center space-y-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-neutral-500">
        Please try again. If the problem persists, come back later.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
