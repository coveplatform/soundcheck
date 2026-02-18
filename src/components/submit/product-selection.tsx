"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  Target,
  MessageSquare,
  Coins,
  CreditCard,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ProductSelectionProps {
  creditBalance: number;
  onReleaseDecisionSubmit: (paymentMethod: "cash" | "credits") => Promise<void>;
  onGeneralFeedbackSubmit: () => Promise<void>;
  onBuyCredits: () => Promise<void>;
  isSubmitting: boolean;
  isBuyingCredits: boolean;
}

export function ProductSelection({
  creditBalance,
  onReleaseDecisionSubmit,
  onGeneralFeedbackSubmit,
  onBuyCredits,
  isSubmitting,
  isBuyingCredits,
}: ProductSelectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<"RELEASE_DECISION" | "PEER">(
    "RELEASE_DECISION"
  );
  const [rdPaymentMethod, setRdPaymentMethod] = useState<"cash" | "credits">("cash");
  const [reviewCount, setReviewCount] = useState(5);
  const [requestProReviewers, setRequestProReviewers] = useState(false);
  const [rushDelivery, setRushDelivery] = useState(false);

  const RD_CREDITS_REQUIRED = 15;
  const hasEnoughCreditsForRD = creditBalance >= RD_CREDITS_REQUIRED;
  const hasEnoughCreditsForPeer = creditBalance >= reviewCount;
  const creditDeficit = reviewCount - creditBalance;

  const cashAddOns =
    (requestProReviewers ? reviewCount * 2 : 0) + (rushDelivery ? 10 : 0);

  return (
    <div className="space-y-6">
      {/* Product Cards */}
      <div className="space-y-4">
        {/* Release Decision Card */}
        <button
          type="button"
          onClick={() => setSelectedProduct("RELEASE_DECISION")}
          className={cn(
            "w-full text-left rounded-2xl border-2 p-6 transition-all",
            selectedProduct === "RELEASE_DECISION"
              ? "border-purple-600 bg-purple-50/60 shadow-lg"
              : "border-neutral-200 bg-white hover:border-purple-300"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                selectedProduct === "RELEASE_DECISION" ? "bg-purple-600" : "bg-purple-100"
              )}
            >
              <Target
                className={cn(
                  "h-5 w-5",
                  selectedProduct === "RELEASE_DECISION" ? "text-white" : "text-purple-600"
                )}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-black">Release Decision</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  RECOMMENDED
                </span>
              </div>

              <p className="text-sm text-neutral-600 mb-3">
                Should I release this track? Get a professional verdict with actionable fixes.
              </p>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Go/No-Go verdict from experts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Top 3 fixes ranked by impact</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Release readiness score (0-100)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>10-12 expert reviewers only</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>48-hour delivery guarantee</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-purple-600">$39</span>
                <span className="text-sm text-neutral-500">or 15 credits</span>
              </div>
            </div>
          </div>
        </button>

        {/* General Feedback Card */}
        <button
          type="button"
          onClick={() => setSelectedProduct("PEER")}
          className={cn(
            "w-full text-left rounded-2xl border-2 p-6 transition-all",
            selectedProduct === "PEER"
              ? "border-purple-600 bg-purple-50/60 shadow-lg"
              : "border-neutral-200 bg-white hover:border-purple-300"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                selectedProduct === "PEER" ? "bg-purple-600" : "bg-neutral-100"
              )}
            >
              <MessageSquare
                className={cn(
                  "h-5 w-5",
                  selectedProduct === "PEER" ? "text-white" : "text-neutral-600"
                )}
              />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-black mb-1">General Feedback</h3>

              <p className="text-sm text-neutral-600 mb-3">
                Get listener opinions and reactions using your credits.
              </p>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <span>Choose review count (1-50)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <span>Genre-matched reviewers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <span>Individual review cards</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <span>Optional add-ons available</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-neutral-700">1 credit/review</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Conditional Content Based on Selection */}
      {selectedProduct === "RELEASE_DECISION" && (
        <div className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Payment method
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRdPaymentMethod("cash")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  rdPaymentMethod === "cash"
                    ? "border-purple-600 bg-purple-50/60"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                )}
              >
                <CreditCard
                  className={cn(
                    "h-5 w-5",
                    rdPaymentMethod === "cash" ? "text-purple-600" : "text-neutral-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-semibold",
                    rdPaymentMethod === "cash" ? "text-purple-700" : "text-neutral-600"
                  )}
                >
                  Pay $39
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRdPaymentMethod("credits")}
                disabled={!hasEnoughCreditsForRD}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  rdPaymentMethod === "credits"
                    ? "border-purple-600 bg-purple-50/60"
                    : "border-neutral-200 bg-white hover:border-neutral-300",
                  !hasEnoughCreditsForRD && "opacity-50 cursor-not-allowed"
                )}
              >
                <Coins
                  className={cn(
                    "h-5 w-5",
                    rdPaymentMethod === "credits" ? "text-purple-600" : "text-neutral-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-semibold",
                    rdPaymentMethod === "credits" ? "text-purple-700" : "text-neutral-600"
                  )}
                >
                  Use 15 Credits
                </span>
                {!hasEnoughCreditsForRD && (
                  <span className="text-xs text-red-600">
                    Need {RD_CREDITS_REQUIRED - creditBalance} more
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Credit Balance Display */}
          <div className="flex items-center gap-3 rounded-xl bg-purple-50 border-2 border-purple-200 px-4 py-3">
            <Coins className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm font-medium text-purple-900">
              You have{" "}
              <span className="text-lg font-bold text-purple-600">{creditBalance}</span>{" "}
              {creditBalance === 1 ? "credit" : "credits"}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => onReleaseDecisionSubmit(rdPaymentMethod)}
            disabled={
              isSubmitting || (rdPaymentMethod === "credits" && !hasEnoughCreditsForRD)
            }
            className="w-full bg-purple-600 text-white hover:bg-purple-700 h-12 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
          >
            {rdPaymentMethod === "cash" ? "Pay $39" : "Use 15 Credits"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {/* Info Box */}
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm text-purple-900">
              <strong>What happens next:</strong> Your track will be assigned to 10-12 expert
              reviewers (100+ reviews, 4.5+ rating). You'll receive your compiled Release
              Decision Report within 48 hours.
            </p>
          </div>
        </div>
      )}

      {selectedProduct === "PEER" && (
        <div className="space-y-6">
          {/* Existing General Feedback UI would go here */}
          {/* For now, showing simplified version - you can expand this */}
          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-5xl font-bold text-purple-600 tabular-nums">
                  {reviewCount}
                </span>
                <span className="text-xl text-neutral-600 font-medium">
                  {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                {reviewCount} {reviewCount === 1 ? "credit" : "credits"} required
              </p>
            </div>

            {/* Slider */}
            <div className="mb-6">
              <input
                type="range"
                min="1"
                max="50"
                value={reviewCount}
                onChange={(e) => setReviewCount(parseInt(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${
                    ((reviewCount - 1) / 49) * 100
                  }%, rgb(229 231 235) ${((reviewCount - 1) / 49) * 100}%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex justify-between mt-2 px-1">
                {[1, 5, 10, 20, 30, 50].map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    onClick={() => setReviewCount(mark)}
                    className={cn(
                      "text-xs font-medium transition-colors",
                      reviewCount === mark ? "text-purple-600" : "text-neutral-400"
                    )}
                  >
                    {mark}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Optional Add-ons</h3>
            <div className="space-y-3">
              <label
                className="flex items-start gap-3 p-4 rounded-xl border-2 hover:border-purple-300 cursor-pointer transition-all"
                style={{
                  borderColor: requestProReviewers ? "rgb(147 51 234)" : "rgb(229 231 235)",
                }}
              >
                <input
                  type="checkbox"
                  checked={requestProReviewers}
                  onChange={(e) => setRequestProReviewers(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">Verified Reviewers</span>
                    <span className="text-sm text-purple-600 font-bold">
                      +${(reviewCount * 2).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    100+ reviews completed, 4.5+ rating
                  </p>
                </div>
              </label>

              <label
                className="flex items-start gap-3 p-4 rounded-xl border-2 hover:border-purple-300 cursor-pointer transition-all"
                style={{ borderColor: rushDelivery ? "rgb(147 51 234)" : "rgb(229 231 235)" }}
              >
                <input
                  type="checkbox"
                  checked={rushDelivery}
                  onChange={(e) => setRushDelivery(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold">Rush Delivery</span>
                    <span className="text-sm text-orange-600 font-bold">+$10.00</span>
                  </div>
                  <p className="text-sm text-neutral-600">All reviews within 30 minutes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit for General Feedback */}
          <Button
            onClick={onGeneralFeedbackSubmit}
            disabled={!hasEnoughCreditsForPeer || isSubmitting}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 h-12 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
          >
            Submit for Review
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {/* Not enough credits */}
          {!hasEnoughCreditsForPeer && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border-2 border-amber-300 p-4">
                <p className="text-sm font-bold text-amber-900 mb-1">Not enough credits</p>
                <p className="text-sm text-amber-800">
                  You need <strong>{creditDeficit} more credits</strong> to request{" "}
                  {reviewCount} reviews.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/review" className="flex-1">
                  <Button variant="outline" className="w-full h-11 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Earn credits
                  </Button>
                </Link>

                <Button
                  onClick={onBuyCredits}
                  disabled={isBuyingCredits}
                  variant="outline"
                  className="w-full h-11 text-sm font-semibold"
                >
                  Buy credits
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
