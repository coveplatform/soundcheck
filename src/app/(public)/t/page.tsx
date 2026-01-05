"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Loader2,
  Music,
  Headphones,
  ListMusic,
  Share2,
  Star,
  ArrowRight,
  Clock,
  Users,
  X,
  Mail,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { trackTikTokEvent } from "@/components/providers";

export default function TikTokLandingPage() {
  const hasTrackedViewContentRef = useRef(false);

  // State
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showExitIntent, setShowExitIntent] = useState(false);
  const exitIntentShownRef = useRef(false);

  // Track ViewContent once
  useEffect(() => {
    if (hasTrackedViewContentRef.current) return;
    hasTrackedViewContentRef.current = true;
    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: "tiktok_landing",
    });
  }, []);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShownRef.current && !isSubmitted) {
        exitIntentShownRef.current = true;
        setShowExitIntent(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isSubmitted]);

  // Handle email submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          source: "tiktok-landing",
          sendEmail: true,
        }),
      });

      trackTikTokEvent("CompleteRegistration", {
        content_name: "tiktok_email_capture",
      });

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center">
              <Logo className="text-white" />
            </Link>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
              <Clock className="h-3 w-3" />
              <span>&lt;12h</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {!isSubmitted ? (
          <div className="space-y-5">
            {/* Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight">
                5 real reviews. $4.95.
              </h1>
              <p className="text-neutral-400 text-sm">
                Genre-matched listeners tell you what's working and what needs fixing.
              </p>
              <div className="flex items-center justify-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-lime-500" />
                  <strong className="text-white">2,847</strong> artists
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-lime-500 fill-lime-500" />
                  <strong className="text-white">4.8</strong> rating
                </span>
              </div>
            </div>

            {/* EXAMPLE REVIEW */}
            <div className="border border-neutral-700 bg-neutral-900/50 text-sm">
              <div className="p-2.5 border-b border-neutral-700 bg-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-lime-500 flex items-center justify-center">
                    <Music className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Midnight Frequency</p>
                    <p className="text-neutral-500 text-xs">Electronic</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-lime-500 text-black px-1.5 py-0.5 font-bold">EXAMPLE</span>
              </div>

              <div className="p-2.5 border-b border-neutral-700 bg-neutral-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-lime-500 flex items-center justify-center text-xs font-bold text-black">S</div>
                  <div>
                    <p className="font-bold text-xs text-white">Sarah M.</p>
                    <p className="text-[10px] text-neutral-500">Electronic • Indie</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                  <Headphones className="h-3 w-3" />
                  4:32
                </div>
              </div>

              <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-700 text-center">
                <div className="py-2">
                  <p className="text-[9px] text-neutral-500">Hook</p>
                  <p className="font-bold text-xs text-lime-500">Strong</p>
                </div>
                <div className="py-2">
                  <p className="text-[9px] text-neutral-500">Production</p>
                  <p className="font-bold text-xs">4/5</p>
                </div>
                <div className="py-2">
                  <p className="text-[9px] text-neutral-500">Original</p>
                  <p className="font-bold text-xs">4/5</p>
                </div>
                <div className="py-2">
                  <p className="text-[9px] text-neutral-500">Again?</p>
                  <p className="font-bold text-xs text-lime-500">Yes</p>
                </div>
              </div>

              <div className="p-2.5 space-y-2">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-3.5 h-3.5 bg-lime-500 flex items-center justify-center text-[9px] font-bold text-black">+</span>
                    <span className="font-bold text-xs">What's Working</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed pl-4">
                    Synth melody at 0:45 is catchy. Punchy kick cuts through. Breakdown at 2:15 adds nice dynamic.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-3.5 h-3.5 bg-orange-400 flex items-center justify-center text-[9px] font-bold text-black">→</span>
                    <span className="font-bold text-xs">To Fix</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed pl-4">
                    Intro too long—trim 8-10 sec. Hi-hats repetitive in verse 2. Vocal at 1:30 clashes with lead.
                  </p>
                </div>
              </div>

              <div className="px-2.5 pb-2.5 flex gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-lime-500/10 border border-lime-500/30 text-lime-500">
                  <ListMusic className="h-2.5 w-2.5" /> Playlist
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-lime-500/10 border border-lime-500/30 text-lime-500">
                  <Share2 className="h-2.5 w-2.5" /> Share
                </span>
              </div>

              <div className="px-2.5 pb-2 pt-1.5 border-t border-neutral-800 flex items-center justify-center gap-3">
                <p className="text-[10px] text-neutral-500">You get 5 reviews like this</p>
                <span className="text-[10px] font-bold text-lime-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> in under 12 hours
                </span>
              </div>
            </div>

            {/* Testimonial - the consensus story */}
            <div className="border-l-2 border-lime-500 pl-3 py-1">
              <p className="text-sm text-neutral-200 mb-1">
                "4 of 5 reviewers said my intro was too long. I cut it—now it's my best performing release."
              </p>
              <p className="text-xs text-neutral-500">— Marcus T., Producer</p>
            </div>

            {/* EMAIL CAPTURE */}
            <div className="bg-neutral-900 border border-neutral-800 p-4">
              <p className="text-sm text-neutral-300 mb-3">
                <strong className="text-white">On your phone?</strong> Drop your email and we'll remind you to finish when you're at your computer.
              </p>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={cn(
                    "flex-1 h-11 bg-black border border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500",
                    error && "border-red-500"
                  )}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-5 font-bold bg-lime-500 text-black hover:bg-lime-400"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remind Me"}
                </Button>
              </form>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>

            {/* Desktop link */}
            <p className="text-center text-xs text-neutral-500">
              At your computer? <Link href="/get-feedback" className="text-lime-500 hover:text-lime-400">Upload now →</Link>
            </p>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="py-10 text-center space-y-5">
            <div className="h-14 w-14 bg-lime-500 flex items-center justify-center mx-auto">
              <Mail className="h-7 w-7 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black mb-1">Check your inbox!</h1>
              <p className="text-neutral-400 text-sm">
                We sent a link to <strong className="text-white">{email}</strong>
              </p>
            </div>
            <div className="border border-neutral-800 p-3 max-w-xs mx-auto text-left">
              <p className="text-sm text-neutral-300 mb-2">When you're at your computer:</p>
              <ol className="text-sm text-neutral-400 space-y-0.5">
                <li>1. Open email from MixReflect</li>
                <li>2. Click link to upload your track</li>
                <li>3. Get 5 reviews for $4.95</li>
              </ol>
            </div>
            <p className="text-xs text-neutral-500">
              Check spam if you don't see it, or{" "}
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="text-lime-500 hover:text-lime-400"
              >
                try again
              </button>
            </p>
          </div>
        )}
      </main>

      {/* Sticky Mobile CTA */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-black/95 backdrop-blur p-3">
          <Button
            onClick={() => {
              const input = document.querySelector('input[type="email"]') as HTMLInputElement;
              input?.focus();
              input?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="w-full h-11 bg-lime-500 text-black font-black border-2 border-lime-500"
          >
            5 Reviews in 12h • $4.95
          </Button>
        </div>
      )}

      {/* Exit Intent - Simple and honest */}
      {showExitIntent && !isSubmitted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xs bg-neutral-900 border border-neutral-700 p-5">
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-black mb-1.5">Not ready yet?</h2>
            <p className="text-neutral-400 text-sm mb-3">
              Drop your email—we'll send the link so you can finish later.
            </p>

            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-10 bg-neutral-800 border border-neutral-600 text-white placeholder:text-neutral-500"
              />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 px-3 bg-lime-500 text-black font-bold hover:bg-lime-400"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>

            <button
              onClick={() => setShowExitIntent(false)}
              className="w-full mt-2.5 text-xs text-neutral-500 hover:text-white"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {/* Bottom padding for sticky CTA */}
      {!isSubmitted && <div className="h-16" />}
    </div>
  );
}
