"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
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
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { trackTikTokEvent } from "@/components/providers";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function TikTokLandingPage() {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const hasTrackedViewContentRef = useRef(false);

  // Check if user just registered (redirected back from Google auth)
  const justRegistered = searchParams.get("registered") === "true";
  const isLoggedIn = !!session?.user;

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
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

  // Track registration, capture lead, and ensure artist flag is set for Google auth
  useEffect(() => {
    if (justRegistered && isLoggedIn && session?.user?.email) {
      trackTikTokEvent("CompleteRegistration", {
        content_name: "tiktok_google_signup",
      });

      // Ensure user is marked as artist (Google OAuth doesn't set this automatically)
      fetch("/api/auth/set-artist", {
        method: "POST",
      }).catch(() => {
        // Ignore errors - they can still complete onboarding
      });

      // Capture lead for tracking (will be marked as converted since they have account)
      fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          source: "tiktok-google",
          sendEmail: false, // No need - they're already signed in
        }),
      }).catch(() => {
        // Ignore errors - this is just for tracking
      });
    }
  }, [justRegistered, isLoggedIn, session?.user?.email]);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShownRef.current && !signupComplete && !isLoggedIn) {
        exitIntentShownRef.current = true;
        setShowExitIntent(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [signupComplete, isLoggedIn]);

  // Password validation
  const passwordErrors = (() => {
    const errors: string[] = [];
    if (password.length > 0) {
      if (password.length < 8) errors.push("8+ chars");
      if (!/[A-Z]/.test(password)) errors.push("uppercase");
      if (!/[a-z]/.test(password)) errors.push("lowercase");
      if (!/\d/.test(password)) errors.push("number");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("symbol");
    }
    return errors;
  })();
  const isPasswordValid = password.length >= 8 && passwordErrors.length === 0;

  // Handle Google sign-in
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/t?registered=true" });
  };

  // Handle email/password signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email");
      return;
    }
    if (!isPasswordValid) {
      setError("Password doesn't meet requirements");
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture lead FIRST (before account creation) so it gets recorded
      // Also sends reminder email
      await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          source: "tiktok-signup",
          sendEmail: true,
        }),
      });

      // Create account
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          name: trimmedEmail.split("@")[0], // Use email prefix as name
          role: "artist", // TikTok traffic is artists looking to submit tracks
          acceptedTerms: true, // Implicit acceptance by signing up
          referralSource: "tiktok",
        }),
      });

      if (!signupRes.ok) {
        const data = await signupRes.json();
        setError(data.error || "Failed to create account");
        setIsSubmitting(false);
        return;
      }

      // Sign in
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
        password,
      });

      if (signInRes?.error) {
        setError("Account created but couldn't sign in. Try logging in.");
        setIsSubmitting(false);
        return;
      }

      trackTikTokEvent("CompleteRegistration", {
        content_name: "tiktok_email_signup",
      });

      setSignupComplete(true);
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
        {!signupComplete && !isLoggedIn ? (
          <div className="space-y-5">
            {/* Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight">
                Real feedback. <span className="text-lime-500">Real fast.</span>
              </h1>
              <p className="text-neutral-400 text-sm">
                Genre-matched listeners tell you what's working and what needs fixing.
              </p>
              <p className="text-xs text-lime-500 font-medium">
                First review on us — no card required
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

              <div className="px-2.5 pb-2 pt-1.5 border-t border-neutral-800 flex items-center justify-center">
                <span className="text-[10px] font-bold text-lime-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Results in under 12 hours
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

            {/* SIGNUP SECTION */}
            <div className="bg-neutral-900 border border-neutral-800 p-4 space-y-3">
              <p className="text-sm text-neutral-300 text-center">
                Create a free account to get your review
              </p>

              {/* Google Sign-In */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-11 bg-white hover:bg-neutral-100 text-black font-bold"
              >
                <GoogleIcon className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-neutral-900 px-2 text-neutral-500">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSignup} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="h-10 bg-black border border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500"
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="h-10 bg-black border border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && passwordErrors.length > 0 && (
                  <p className="text-[10px] text-neutral-500">Needs: {passwordErrors.join(", ")}</p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
                <Button
                  type="submit"
                  disabled={isSubmitting || !email || !isPasswordValid}
                  className="w-full h-10 font-bold bg-lime-500 text-black hover:bg-lime-400 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-[10px] text-neutral-600">
                Already have an account? <Link href="/login" className="text-lime-500">Log in</Link>
              </p>
              <p className="text-center text-[10px] text-neutral-600">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-neutral-400">Terms</Link> and{" "}
                <Link href="/privacy" className="underline hover:text-neutral-400">Privacy Policy</Link>
              </p>
            </div>

            {/* Desktop link */}
            <p className="text-center text-xs text-neutral-500">
              At your computer? <Link href="/get-feedback" className="text-lime-500 hover:text-lime-400">Upload now →</Link>
            </p>
          </div>
        ) : (
          /* SUCCESS STATE - Show when logged in or just signed up */
          <div className="py-10 text-center space-y-5">
            <div className="h-14 w-14 bg-lime-500 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black mb-1">You're in!</h1>
              <p className="text-neutral-400 text-sm">
                Ready to get feedback on your track.
              </p>
            </div>
            <div className="border border-neutral-800 p-4 max-w-xs mx-auto text-left">
              <p className="text-sm text-neutral-300 mb-2">Next steps:</p>
              <ol className="text-sm text-neutral-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-lime-500 font-bold">1.</span>
                  <span>Upload your track</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime-500 font-bold">2.</span>
                  <span>Get your review in under 12 hours</span>
                </li>
              </ol>
            </div>
            <Link href="/get-feedback">
              <Button className="bg-lime-500 text-black hover:bg-lime-400 font-bold">
                Submit Your Track <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-neutral-500">
              On mobile? We'll email you a reminder to finish on desktop.
            </p>
          </div>
        )}
      </main>

      {/* Sticky Mobile CTA */}
      {!signupComplete && !isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-black/95 backdrop-blur p-3">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-11 bg-lime-500 text-black font-black border-2 border-lime-500"
          >
            <GoogleIcon className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>
        </div>
      )}

      {/* Exit Intent - Encourage signup */}
      {showExitIntent && !signupComplete && !isLoggedIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xs bg-neutral-900 border border-neutral-700 p-5">
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-lime-500 flex items-center justify-center">
                <Headphones className="h-4 w-4 text-black" />
              </div>
              <h2 className="text-lg font-black">Get real feedback</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-3">
              Create a free account now—upload your track when you're at your computer.
            </p>

            <Button
              onClick={() => { setShowExitIntent(false); handleGoogleSignIn(); }}
              className="w-full h-10 bg-lime-500 hover:bg-lime-400 text-black font-bold"
            >
              Continue with Google
            </Button>

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
      {!signupComplete && !isLoggedIn && <div className="h-16" />}
    </div>
  );
}
