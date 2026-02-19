"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
  const referralCode = searchParams.get("ref") || undefined;

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
          router.replace("/dashboard");
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

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, acceptedTerms, referralCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        let errorMsg = data?.error;
        if (!errorMsg) {
          if (response.status === 400) {
            errorMsg = "Invalid signup details. Please check your email and password.";
          } else if (response.status === 409) {
            errorMsg = "An account with this email already exists. Try signing in instead.";
          } else if (response.status >= 500) {
            errorMsg = "Our servers are having issues. Please try again in a moment.";
          } else {
            errorMsg = "Failed to create account. Please try again.";
          }
        }
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

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
        // Keep loading state active during navigation
        return;
      }

      // Redirect to submit page or callback URL
      // Keep loading state active during navigation
      router.push(callbackUrl || "/onboarding");
      router.refresh();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to create account. Please try again.");
      }
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
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Create your account</h1>
        <p className="mt-2 text-neutral-500">2 free credits to start • No credit card required</p>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-white border-2 border-neutral-300 text-neutral-950 hover:bg-neutral-100 hover:border-neutral-400 font-bold transition-colors duration-150 ease-out motion-reduce:transition-none"
        onClick={() => signIn("google", { callbackUrl: callbackUrl || "/onboarding" })}
      >
        <GoogleIcon className="h-5 w-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#f7f7f5] px-4 text-neutral-500">or</span>
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
            className="w-full rounded-none border-0 border-b-2 border-neutral-300 px-0 py-3 text-neutral-950 text-lg placeholder:text-neutral-400 focus:border-purple-600 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 bg-transparent [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(247,247,245)] [-webkit-autofill]:[-webkit-text-fill-color:rgb(10,10,10)]"
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
            className="w-full rounded-none border-0 border-b-2 border-neutral-300 px-0 py-3 text-neutral-950 text-lg placeholder:text-neutral-400 focus:border-purple-600 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 bg-transparent [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(247,247,245)] [-webkit-autofill]:[-webkit-text-fill-color:rgb(10,10,10)]"
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
            className="mt-1 h-4 w-4 bg-transparent border-2 border-neutral-400 accent-purple-600 cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm text-neutral-600 cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="text-neutral-950 hover:text-purple-700 transition-colors">
              Terms
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-neutral-950 hover:text-purple-700 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black text-base border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none"
            isLoading={isLoading}
            disabled={!acceptedTerms || !validatePassword(password).valid}
          >
            Create account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

      </form>

      <p className="text-sm text-neutral-600 text-center mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-neutral-950 font-bold hover:text-purple-700 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
