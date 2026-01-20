"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, MessageSquare } from "lucide-react";

interface ReviewUpsellProps {
  completedReviews: number;
  trackTitle: string;
  /** Whether reviewer said they would listen again */
  wouldListenAgain?: boolean;
}

export function ReviewUpsell({
  completedReviews,
  trackTitle: _trackTitle,
  wouldListenAgain,
}: ReviewUpsellProps) {
  // Only show for small review counts (1-3 reviews, typically free trial users)
  if (completedReviews > 3) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border-2 border-black p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-orange-400 font-black text-sm tracking-wider mb-2">
          YOU GOT 1 OPINION
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          But is it taste, or truth?
        </h3>
        <p className="text-neutral-400 mt-2 text-sm sm:text-base">
          One reviewer {wouldListenAgain ? "loved it" : "gave feedback"} — but would others agree?
        </p>
      </div>

      {/* What you're missing */}
      <div className="bg-black/50 border border-neutral-700 p-4 sm:p-5 mb-6">
        <p className="text-xs font-black text-neutral-500 tracking-wider mb-4">
          WITH 5+ REVIEWS, YOU&apos;D SEE:
        </p>

        <div className="space-y-3">
          {/* Consensus teaser */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-lime-500/20 border border-lime-500/30 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-lime-500" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Consensus patterns</p>
              <p className="text-neutral-400 text-xs">
                &quot;4 of 5 said the intro is too long&quot; — now you <span className="text-white">know</span> it&apos;s not just taste
              </p>
            </div>
          </div>

          {/* Confidence teaser */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-orange-400/20 border border-orange-400/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Release confidence</p>
              <p className="text-neutral-400 text-xs">
                See what % would replay, playlist, and share your track
              </p>
            </div>
          </div>

          {/* Multiple perspectives */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-blue-400/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Different ears</p>
              <p className="text-neutral-400 text-xs">
                What one person misses, another catches
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing teaser */}
      <div className="text-center mb-6">
        <div className="inline-flex items-baseline gap-2">
          <span className="text-neutral-500 text-sm">Starting at</span>
          <span className="text-3xl font-black text-white">$4.95</span>
          <span className="text-neutral-500 text-sm">for 5 reviews</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/artist/submit">
          <Button
            size="lg"
            className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none"
          >
            Get more feedback <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-neutral-500">
          Submit this track or a new one
        </p>
      </div>
    </div>
  );
}
