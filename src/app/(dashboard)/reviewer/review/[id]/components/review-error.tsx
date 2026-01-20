"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

interface ReviewErrorProps {
  error: string;
}

export function ReviewError({ error }: ReviewErrorProps) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-16 h-16 bg-red-100 border-2 border-black flex items-center justify-center mx-auto mb-6">
        <Music className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
      <p className="text-neutral-600 mb-6">{error}</p>
      <Link href="/listener/queue">
        <Button variant="outline">Back to Queue</Button>
      </Link>
    </div>
  );
}
