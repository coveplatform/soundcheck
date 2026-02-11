"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface MobileStickyCTAProps {
  show: boolean;
}

export function MobileStickyCTA({ show }: MobileStickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA when scrolled past 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show || !isVisible) return null;

  return (
    <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 z-30 p-4 bg-white/95 backdrop-blur-sm border-t border-black/10 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-black">
            Ready to get feedback?
          </p>
          <p className="text-xs text-black/50">Submit your track now</p>
        </div>
        <Link href="/submit">
          <Button
            size="sm"
            className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150 ease-out whitespace-nowrap"
          >
            Submit track
            <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
