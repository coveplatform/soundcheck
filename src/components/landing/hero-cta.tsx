"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SignupLink } from "./signup-link";

export function HeroCTA() {
  return (
    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
      <SignupLink>
        <Button
          size="lg"
          className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black text-lg px-8 py-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[6px] active:translate-y-[6px] transition-all duration-150 ease-out"
        >
          Start for free <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </SignupLink>
      <Link href="#examples">
        <Button
          variant="outline"
          size="lg"
          className="bg-white border-2 border-neutral-300 text-neutral-950 hover:bg-neutral-50 font-bold text-lg px-8 py-6"
        >
          See examples
        </Button>
      </Link>
    </div>
  );
}
