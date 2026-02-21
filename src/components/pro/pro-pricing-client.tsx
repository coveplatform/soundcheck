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
      <div className="text-center py-16">
        {isSuccess && (
          <div className="mb-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm font-semibold">
            <Check className="h-4 w-4" />
            Welcome to Pro! Your subscription is now active.
          </div>
        )}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-bold text-sm mb-6">
          <Crown className="h-4 w-4" />
          You&apos;re on Pro
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black mb-3">
          You&apos;re already a Pro member
        </h1>
        <p className="text-black/50 mb-8 max-w-md mx-auto">
          You have access to all Pro features including 3 review slots, priority queue placement, and your Pro badge.
        </p>
        <Button
          onClick={handleManage}
          isLoading={isLoading}
          variant="outline"
          className="h-12 px-6"
        >
          Manage subscription
        </Button>
      </div>
    );
  }

  return (
    <div>
      {isCanceled && (
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-100 border-2 border-neutral-200 text-neutral-700 text-sm font-medium">
            Checkout canceled. No charges were made.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-purple-600 mb-3">
          Upgrade
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black mb-4">
          Get more from your music
        </h1>
        <p className="text-black/50 max-w-lg mx-auto text-lg">
          Submit more tracks, get feedback faster, and stand out in the community.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free tier */}
        <div className="bg-white border-2 border-neutral-200 rounded-2xl p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-black mb-1">Free</h3>
            <p className="text-sm text-black/50">For getting started</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-black">$0</span>
              <span className="text-black/40 text-sm">/forever</span>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {FREE_FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-start gap-2.5">
                {feature.included ? (
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-neutral-300 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    feature.included ? "text-black" : "text-neutral-400"
                  )}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-black/40 font-medium">
            Your current plan
          </div>
        </div>

        {/* Pro tier */}
        <div className="bg-white border-2 border-purple-500 rounded-2xl p-8 relative shadow-lg shadow-purple-100">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-black">Pro</h3>
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-black/50">For serious artists</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-purple-600">$9.99</span>
              <span className="text-black/40 text-sm">/month</span>
            </div>
            <p className="text-xs text-black/40 mt-1">Cancel anytime</p>
          </div>

          <div className="space-y-3 mb-8">
            {PRO_FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-start gap-2.5">
                <Check
                  className={cn(
                    "h-4 w-4 flex-shrink-0 mt-0.5",
                    feature.highlight ? "text-purple-600" : "text-emerald-500"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    feature.highlight ? "text-black font-semibold" : "text-black"
                  )}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            isLoading={isLoading}
            className="w-full h-12 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out rounded-xl"
          >
            Upgrade to Pro
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Why Pro section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-black mb-8">
          Why artists upgrade
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-black mb-1">Move faster</h3>
            <p className="text-sm text-black/50">
              3 tracks in the queue means you can iterate on multiple ideas at once instead of waiting.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-black mb-1">Get heard first</h3>
            <p className="text-sm text-black/50">
              Priority queue placement means reviewers see your tracks before free-tier submissions.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-black mb-1">Support the community</h3>
            <p className="text-sm text-black/50">
              Your subscription keeps MixReflect running and free for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-black mb-8">
          Common questions
        </h2>

        <div className="space-y-4">
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
            <div key={q} className="border-2 border-neutral-200 rounded-xl p-5">
              <h3 className="font-semibold text-black mb-1.5">{q}</h3>
              <p className="text-sm text-black/60">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
