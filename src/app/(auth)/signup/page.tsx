"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { funnels, track } from "@/lib/analytics";
import { redditEvents, trackTikTokEvent } from "@/components/providers";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validatePassword } from "@/lib/password";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Role = "artist" | "reviewer" | "both";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "";
  const role: Role = "artist";

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((session) => {
        if (cancelled) return;
        if (session?.user) {
          const defaultUrl = session.user.isArtist
            ? "/artist/dashboard"
            : session.user.isReviewer
            ? "/reviewer/dashboard"
            : "/";
          router.replace(defaultUrl);
          router.refresh();
          return;
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Track page view
  useEffect(() => {
    if (isCheckingSession) return;
    funnels.artistSignup.start();
  }, [isCheckingSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError("Password doesn't meet requirements: " + passwordValidation.errors[0]);
      return;
    }

    if (!acceptedTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }

    setError("");
    setIsLoading(true);
    funnels.artistSignup.submit(role);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, acceptedTerms }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const errorMsg = data?.error || "Something went wrong";
        setError(errorMsg);
        track("signup_failed", { error: errorMsg });
        return;
      }

      const data = await response.json().catch(() => ({}));
      funnels.artistSignup.complete(data.userId || "unknown", role);

      // Reddit conversion tracking
      redditEvents.signUp();

      // TikTok conversion tracking
      trackTikTokEvent("CompleteRegistration", {
        content_name: role,
      });

      // Sign in the user automatically
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Signup succeeded but auto-login failed - redirect to login
        router.push("/login");
        return;
      }

      // Redirect to submit page or callback URL
      router.push(callbackUrl || "/artist/submit");
      router.refresh();
    } catch {
      setError("Something went wrong");
      track("signup_failed", { error: "network_error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Start your trial</h1>
        <p className="mt-2 text-neutral-500">Email and password. That&apos;s it.</p>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-transparent border-2 border-neutral-800 text-white hover:bg-white hover:text-black hover:border-white font-bold transition-all"
        onClick={() => signIn("google", { callbackUrl: callbackUrl || "/artist/submit" })}
      >
        <GoogleIcon className="h-5 w-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-4 text-neutral-600">or</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-400 text-sm py-3 px-4 bg-red-500/10 border-l-2 border-red-500">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-none border-0 border-b-2 border-neutral-800 px-0 py-3 text-white text-lg placeholder:text-neutral-700 focus:border-lime-500 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 autofill-dark"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-none border-0 border-b-2 border-neutral-800 px-0 py-3 text-white text-lg placeholder:text-neutral-700 focus:border-lime-500 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 autofill-dark"
            style={{ backgroundColor: 'transparent' }}
          />
          <div className="mt-3">
            <PasswordStrength password={password} />
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            id="terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 bg-transparent border-2 border-neutral-700 accent-lime-500 cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm text-neutral-400 cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="text-white hover:text-lime-500 transition-colors">
              Terms
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-white hover:text-lime-500 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-black text-base border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none"
            isLoading={isLoading}
            disabled={!acceptedTerms || !validatePassword(password).valid}
          >
            Create account
          </Button>
        </div>

        <p className="text-sm text-neutral-600 text-center pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-bold hover:text-lime-500 transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
