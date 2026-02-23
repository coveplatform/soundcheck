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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProPricingClientProps {
  isPro: boolean;
}

const FREE_FEATURES = [
  { text: "1 track in review queue at a time", included: true },
  { text: "Earn credits by reviewing others", included: true },
  { text: "Genre-matched peer reviews", included: true },
  { text: "Structured feedback on every review", included: true },
  { text: "Public track sharing page", included: true },
  { text: "3 concurrent review slots", included: false },
  { text: "Priority queue placement", included: false },
  { text: "Pro badge on your profile", included: false },
];

const PRO_FEATURES = [
  { text: "3 tracks in review queue at a time", included: true, highlight: true },
  { text: "Earn credits by reviewing others", included: true },
  { text: "Genre-matched peer reviews", included: true },
  { text: "Structured feedback on every review", included: true },
  { text: "Public track sharing page", included: true },
  { text: "Priority queue placement", included: true, highlight: true },
  { text: "Pro badge on your profile", included: true, highlight: true },
  { text: "Early access to new features", included: true },
];

export function ProPricingClient({ isPro }: ProPricingClientProps) {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";

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

  if (isPro || isSuccess) {
    return (
      <div className="space-y-5">
        {isSuccess && (
          <div className="bg-lime-400 border-2 border-black rounded-2xl px-5 py-4 flex items-center gap-3">
            <Check className="h-5 w-5 text-black flex-shrink-0" />
            <p className="text-sm font-black text-black">Welcome to Pro! Your subscription is now active.</p>
          </div>
        )}
        <div className="bg-neutral-900 rounded-2xl px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              <Crown className="h-3 w-3" />
              Pro Member
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">You&apos;re on Pro.</h2>
            <p className="text-sm text-white/40 font-medium mt-1">
              3 slots, priority placement, Pro badge — all active.
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

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Free tier */}
        <div className="bg-white border-2 border-black/8 rounded-2xl p-7 flex flex-col">
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

        {/* Pro tier */}
        <div className="bg-neutral-900 border-2 border-black rounded-2xl p-7 flex flex-col relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 left-6">
            <span className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-black">
              Recommended
            </span>
          </div>

          <div className="mb-5 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-black text-white tracking-tight">Pro</h3>
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-sm text-white/40 font-medium">For serious artists</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tabular-nums">$9.99</span>
              <span className="text-white/30 text-sm font-black">/month</span>
            </div>
            <p className="text-[11px] text-white/25 font-medium mt-1">Cancel anytime</p>
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

      {/* Why Pro — dark block */}
      <div className="bg-neutral-900 rounded-2xl px-6 py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Why upgrade</p>
        <h2 className="text-2xl font-black text-white tracking-tight mb-6">Why artists go Pro.</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: <Zap className="h-5 w-5 text-black" />, title: "Move faster", body: "3 tracks in the queue means you can iterate on multiple ideas at once instead of waiting." },
            { icon: <MessageSquare className="h-5 w-5 text-black" />, title: "Get heard first", body: "Priority queue placement means reviewers see your tracks before free-tier submissions." },
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
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your account settings and you'll keep Pro until the end of your billing period. No lock-in, no hassle.",
            },
            {
              q: "Do I still need credits with Pro?",
              a: "Yes — credits are how you request reviews. Pro gives you more slots (3 vs 1) so you can have more tracks reviewed at once, but each review still costs 1 credit. Earn credits by reviewing other artists.",
            },
            {
              q: "What happens to my tracks if I downgrade?",
              a: "Any tracks currently in the queue will finish normally. You just won't be able to submit new tracks beyond 1 slot until the others complete.",
            },
            {
              q: "Is there a free trial?",
              a: "MixReflect itself is free forever. You can submit tracks, get reviews, and earn credits without paying anything. Pro is for artists who want to move faster.",
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
