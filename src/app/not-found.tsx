import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-20 text-center space-y-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-neutral-500">
        The page you were looking for doesn't exist.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/">
          <Button>Go home</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Log in</Button>
        </Link>
      </div>
    </div>
  );
}
