"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CREDIT_PACK_CREDITS, CREDIT_PACK_PRICE_DISPLAY } from "@/lib/pricing";
import { Coins, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyCreditsButtonProps {
  className?: string;
  label?: string;
  variant?: "primary" | "card";
  iconOnLeft?: boolean;
  returnPath?: string;
}

export function BuyCreditsButton({
  className,
  label,
  variant = "primary",
  iconOnLeft = true,
  returnPath,
}: BuyCreditsButtonProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: returnPath ?? pathname ?? "/classic/dashboard" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to create credit pack checkout:", err);
      setIsLoading(false);
    }
  };

  const text =
    label || `Buy ${CREDIT_PACK_CREDITS} credits for ${CREDIT_PACK_PRICE_DISPLAY}`;

  if (variant === "card") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-white hover:bg-neutral-50 text-black text-[11px] font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60",
          className
        )}
      >
        {iconOnLeft && <Coins className="h-4 w-4" />}
        {isLoading ? "Loading…" : text}
        {!iconOnLeft && <ArrowRight className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      isLoading={isLoading}
      className={cn(
        "bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl",
        className
      )}
    >
      {iconOnLeft && <Coins className="h-4 w-4 mr-2" />}
      {text}
      {!iconOnLeft && <ArrowRight className="h-4 w-4 ml-2" />}
    </Button>
  );
}
