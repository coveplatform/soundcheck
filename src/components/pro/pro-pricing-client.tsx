"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Zap,
  MessageSquare,
  Crown,
  ArrowRight,
  Shield,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BuyCreditsButton } from "@/components/credits/buy-credits-button";
import {
  CREDIT_PACK_CREDITS,
  CREDIT_PACK_PRICE_DISPLAY,
  PRO_MONTHLY_CREDITS,
  PRO_MONTHLY_PRICE_DISPLAY,
  PRO_ACTIVE_SLOTS,
  PRO_MAX_REVIEWS_PER_TRACK,
} from "@/lib/pricing";

interface ProPricingClientProps {
  isPro: boolean;
}

const FREE_FEATURES = [
  { text: "1 track in review at a time", included: true },
  { text: "Earn credits by reviewing others", included: true },
  { text: "Structured feedback on every review", included: true },
  { text: "Shareable feedback pages", included: true },
  { text: "No grind — credits included", included: false },
  { text: "Priority placement", included: false },
];

const PACK_FEATURES = [
  { text: `${CREDIT_PACK_CREDITS} credits added to your wallet`, included: true, highlight: true },
  { text: "Credits never expire", included: true, highlight: true },
  { text: "Skip the review-to-earn loop", included: true, highlight: true },
  { text: "Buy again whenever you want", included: true },
  { text: "Structured feedback on every review", included: true },
  { text: "Priority placement", included: false },
];

const PRO_FEATURES = [
  { text: `${PRO_MONTHLY_CREDITS} credits every month`, included: true, highlight: true },
  { text: `Up to ${PRO_MAX_REVIEWS_PER_TRACK} reviews per track`, included: true, highlight: true },
  { text: `${PRO_ACTIVE_SLOTS} tracks in review at a time`, included: true, highlight: true },
  { text: "Priority placement", included: true, highlight: true },
  { text: "Unlimited reviews per day", included: true, highlight: true },
  { text: "Earn extra credits by reviewing others", included: true },
  { text: "Structured feedback on every review", included: true },
  { text: "Early access to new features", included: true },
];

export function ProPricingClient({ isPro }: ProPricingClientProps) {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";
  const creditsCanceled = searchParams.get("credits_canceled") === "1";

  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManage = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open portal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Pro members: simplified view with billing portal + option to top up
  if (isPro || isSuccess) {
    return (
      <div className="space-y-5">
        <div className="bg-neutral-900 rounded-2xl px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              <Crown className="h-3 w-3" />
              Pro Member
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">You&apos;re on Pro.</h2>
            <p className="text-sm text-white/40 font-medium mt-1">
              {PRO_MONTHLY_CREDITS} credits every month, up to {PRO_MAX_REVIEWS_PER_TRACK} reviews per track, priority placement — all active.
            </p>
          </div>
          <Button
            onClick={handleManage}
            isLoading={isLoading}
            className="flex-shrink-0 border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white font-black h-10 px-5 rounded-xl text-sm transition-all"
          >
            Manage subscription
          </Button>
        </div>

        {/* Top-up option for Pro members who burn through their monthly credits */}
        <div className="bg-white border-2 border-black/8 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-black text-black">Need more credits this month?</p>
            </div>
            <p className="text-xs text-black/50 font-medium">
              Top up with a {CREDIT_PACK_CREDITS}-credit pack for {CREDIT_PACK_PRICE_DISPLAY}. Never expires.
            </p>
          </div>
          <BuyCreditsButton variant="card" className="sm:w-auto sm:px-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {isCanceled && (
        <div className="bg-black/5 border-2 border-black/10 rounded-2xl px-5 py-4 text-center">
          <p className="text-sm font-bold text-black/50">Checkout canceled. No charges were made.</p>
        </div>
      )}
      {creditsCanceled && (
        <div className="bg-black/5 border-2 border-black/10 rounded-2xl px-5 py-4 text-center">
          <p className="text-sm font-bold text-black/50">Credit pack purchase canceled. No charges were made.</p>
        </div>
      )}

      {/* Pricing cards — 3 columns */}
      <div className="grid md:grid-cols-3 gap-5">

        {/* Free tier */}
        <div className="bg-white border-2 border-black/8 rounded-2xl p-6 flex flex-col">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-1">Current plan</p>
            <h3 className="text-2xl font-black text-black tracking-tight">Free</h3>
            <p className="text-sm text-black/40 font-medium mt-0.5">For getting started</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-black tabular-nums">$0</span>
              <span className="text-black/30 text-sm font-black">/forever</span>
            </div>
          </div>

          <div className="space-y-2.5 mb-8 flex-1">
            {FREE_FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-start gap-2.5">
                {feature.included ? (
                  <Check className="h-4 w-4 text-lime-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-black/15 flex-shrink-0 mt-0.5" />
                )}
                <span className={cn("text-sm font-medium", feature.included ? "text-black" : "text-black/30")}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center text-[11px] font-black uppercase tracking-wider text-black/25 border-t-2 border-black/8 pt-5">
            Your current plan
          </div>
        </div>

        {/* Credit Pack tier */}
        <div className="bg-white border-2 border-black/8 rounded-2xl p-6 flex flex-col">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 mb-1">One-time</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-black tracking-tight">Credit Pack</h3>
              <Coins className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-black/40 font-medium mt-0.5">For occasional releases</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-black tabular-nums">{CREDIT_PACK_PRICE_DISPLAY}</span>
              <span className="text-black/30 text-sm font-black">/once</span>
            </div>
            <p className="text-[11px] text-black/30 font-medium mt-1">{CREDIT_PACK_CREDITS} credits — never expire</p>
          </div>

          <div className="space-y-2.5 mb-8 flex-1">
            {PACK_FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-start gap-2.5">
                {feature.included ? (
                  <Check className={cn("h-4 w-4 flex-shrink-0 mt-0.5", feature.highlight ? "text-purple-600" : "text-lime-500")} />
                ) : (
                  <X className="h-4 w-4 text-black/15 flex-shrink-0 mt-0.5" />
                )}
                <span className={cn("text-sm font-medium", feature.included ? (feature.highlight ? "text-black font-black" : "text-black") : "text-black/30")}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <BuyCreditsButton
            variant="card"
            className="h-12 text-sm rounded-xl bg-black text-white hover:bg-neutral-800 border-black shadow-[3px_3px_0_rgba(0,0,0,0.15)]"
            label={`Buy ${CREDIT_PACK_CREDITS} credits — ${CREDIT_PACK_PRICE_DISPLAY}`}
            iconOnLeft={false}
          />
        </div>

        {/* Pro tier */}
        <div className="bg-neutral-900 border-2 border-black rounded-2xl p-6 flex flex-col relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 left-6">
            <span className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-black">
              Best value
            </span>
          </div>

          <div className="mb-5 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-black text-white tracking-tight">Pro</h3>
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-sm text-white/40 font-medium">For active artists</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tabular-nums">{PRO_MONTHLY_PRICE_DISPLAY}</span>
              <span className="text-white/30 text-sm font-black">/month</span>
            </div>
            <p className="text-[11px] text-white/25 font-medium mt-1">
              {PRO_MONTHLY_CREDITS} credits/month · cancel anytime
            </p>
          </div>

          <div className="space-y-2.5 mb-8 flex-1">
            {PRO_FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-start gap-2.5">
                <Check className={cn("h-4 w-4 flex-shrink-0 mt-0.5", feature.highlight ? "text-purple-400" : "text-white/40")} />
                <span className={cn("text-sm font-medium", feature.highlight ? "text-white font-black" : "text-white/60")}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            isLoading={isLoading}
            className="w-full h-12 bg-purple-600 text-white hover:bg-purple-500 font-black border-2 border-white/20 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
          >
            Upgrade to Pro
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Value compare strip */}
      <div className="bg-black/5 border-2 border-black/10 rounded-2xl px-5 py-4 text-center">
        <p className="text-sm font-bold text-black/60">
          <span className="text-black font-black">Tip:</span> Pro is the best per-credit value — {PRO_MONTHLY_CREDITS} credits for {PRO_MONTHLY_PRICE_DISPLAY} works out cheaper than buying 3 packs.
        </p>
      </div>

      {/* Why Pro — dark block */}
      <div className="bg-neutral-900 rounded-2xl px-6 py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Why upgrade</p>
        <h2 className="text-2xl font-black text-white tracking-tight mb-6">Why artists go Pro.</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: <Zap className="h-5 w-5 text-black" />, title: "Credits included", body: `${PRO_MONTHLY_CREDITS} credits land in your account every month — no reviewing required to earn them.` },
            { icon: <MessageSquare className="h-5 w-5 text-black" />, title: "Get heard first", body: "Your tracks appear at the top of the reviewer queue with a Priority badge — free submissions go behind you." },
            { icon: <Shield className="h-5 w-5 text-black" />, title: "Support the community", body: "Your subscription keeps MixReflect running and free for everyone." },
          ].map((item) => (
            <div key={item.title} className="bg-white/5 rounded-xl p-5">
              <div className="w-9 h-9 rounded-xl bg-lime-400 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <p className="text-sm font-black text-white mb-1">{item.title}</p>
              <p className="text-sm text-white/40 font-medium leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">FAQ</p>
        <h2 className="text-2xl font-black text-black tracking-tight mb-5">Common questions.</h2>
        <div className="space-y-3">
          {[
            {
              q: "What's the difference between credit packs and Pro?",
              a: `A credit pack is a one-time purchase — ${CREDIT_PACK_CREDITS} credits for ${CREDIT_PACK_PRICE_DISPLAY} that never expire. Pro is a monthly subscription with ${PRO_MONTHLY_CREDITS} credits each month, priority placement, and more active track slots. If you submit a track every now and then, packs are great. If you're regularly releasing, Pro saves you money.`,
            },
            {
              q: "Do credits expire?",
              a: "No. Credits never expire. Whether you earn them by reviewing, buy a pack, or get them with Pro, they stay in your wallet until you use them.",
            },
            {
              q: "Can I cancel Pro anytime?",
              a: "Yes. Cancel from your account settings and you'll keep Pro until the end of your billing period. No lock-in, no hassle.",
            },
            {
              q: "What happens to my tracks if I cancel Pro?",
              a: "Any tracks currently in review will finish normally. You'll keep any unused credits in your wallet. You just won't get the monthly credit drop or priority placement anymore.",
            },
            {
              q: "Is there a free trial?",
              a: "MixReflect itself is free forever. You can submit tracks, earn credits by reviewing others, and get feedback without paying anything. Pro and packs are for artists who want credits without having to review, or who want priority placement in the queue.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white border-2 border-black/8 rounded-2xl p-5">
              <h3 className="font-black text-black mb-1.5">{q}</h3>
              <p className="text-sm text-black/50 font-medium leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
