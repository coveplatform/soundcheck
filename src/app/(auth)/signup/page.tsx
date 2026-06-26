"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ArrowRight, Loader2 } from "lucide-react";
import { redditEvents, trackTikTokEvent } from "@/components/providers";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validatePassword } from "@/lib/password";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
  const [showEmailForm, setShowEmailForm] = useState(Boolean(searchParams.get("email")));

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((session) => {
        if (cancelled) return;
        if (session?.user) {
          router.replace(callbackUrl || "/dashboard");
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
  }, [router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        body: JSON.stringify({ email, password, role, acceptedTerms }),
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

      redditEvents.signUp();
      trackTikTokEvent("CompleteRegistration", { content_name: role });

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push(callbackUrl || "/dashboard");
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
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  const inputCls = `${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none transition-colors`;

  return (
    <div className={`${jakarta.className} w-full`}>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">create your account</h1>
        <p className={`${mono.className} mt-2 text-[13px] text-white/50`}>
          first report free · no credit card
        </p>
      </div>

      {error && (
        <div className="text-[#ff7a90] text-sm py-3 px-4 bg-[#ff7a90]/10 border-l-2 border-[#ff7a90] mb-6">
          {error}
        </div>
      )}

      {/* Google — primary path */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: callbackUrl || "/dashboard" })}
        className="w-full inline-flex items-center justify-center gap-2.5 bg-white text-black font-extrabold text-[15px] py-3.5 hover:bg-white/90 transition-colors"
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </button>

      {!showEmailForm ? (
        <>
          <p className={`${mono.className} mt-4 text-[11px] text-white/40 text-center leading-relaxed normal-case`}>
            by continuing you agree to our{" "}
            <Link href="/terms" className="hover:text-white transition-colors underline">terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:text-white transition-colors underline">privacy policy</Link>
          </p>
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className={`${mono.className} mt-5 w-full text-center text-[13px] text-white/50 hover:text-white transition-colors`}
          >
            sign up with email instead
          </button>
        </>
      ) : (
        <>
          <div className={`${mono.className} flex items-center gap-3 my-7 text-[11px] text-white/25`}>
            <div className="h-px bg-white/10 flex-1" /> or with email <div className="h-px bg-white/10 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`${mono.className} block text-[12px] text-white/55 mb-2`}>
                email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="password" className={`${mono.className} block text-[12px] text-white/55 mb-2`}>
                password
              </label>
              <input
                id="password"
                type="password"
                placeholder="create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputCls}
              />
              <div className="mt-3">
                <PasswordStrength password={password} />
              </div>
            </div>

            <label htmlFor="terms" className="flex items-start gap-3 pt-1 cursor-pointer">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 bg-[#141414] border border-white/25 accent-[#6ee7ff] cursor-pointer"
              />
              <span className={`${mono.className} text-[12px] text-white/55 normal-case leading-relaxed`}>
                I agree to the{" "}
                <Link href="/terms" className="hover:text-white transition-colors underline" style={{ color: ACCENT }}>
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="hover:text-white transition-colors underline" style={{ color: ACCENT }}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !acceptedTerms || !validatePassword(password).valid}
              className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> creating account…
                </>
              ) : (
                <>
                  create account
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <p className={`${mono.className} text-[13px] text-white/50 text-center mt-8`}>
        already have an account?{" "}
        <Link href="/login" className="font-bold hover:text-white transition-colors" style={{ color: ACCENT }}>
          sign in
        </Link>
      </p>
    </div>
  );
}
