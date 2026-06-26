"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { ArrowRight, Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validatePassword } from "@/lib/password";
import { redditEvents, trackTikTokEvent } from "@/components/providers";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

type Mode = "signin" | "signup";

type AuthModalContextValue = {
  /** Open the auth modal. `mode` defaults to "signin". `callbackUrl` is where
   *  the user lands after success (defaults to /dashboard). */
  open: (mode?: Mode, callbackUrl?: string) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return ctx;
}

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

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [callbackUrl, setCallbackUrl] = useState<string | undefined>(undefined);

  const open = useCallback((m: Mode = "signin", cb?: string) => {
    setMode(m);
    setCallbackUrl(cb);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ open, close }}>
      {children}
      <AuthDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        mode={mode}
        setMode={setMode}
        callbackUrl={callbackUrl}
      />
    </AuthModalContext.Provider>
  );
}

function AuthDialog({
  isOpen,
  onOpenChange,
  mode,
  setMode,
  callbackUrl,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const dest = callbackUrl && callbackUrl !== "/" ? callbackUrl : "/dashboard";
  // Triggered mid-flow (e.g. after submitting a track), the callbackUrl points
  // at the report/finish route — explain *why* the modal appeared instead of a
  // bare "create your account".
  const forReport = !!callbackUrl && /\/(score\/finish|report)\b/.test(callbackUrl);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function resetForm() {
    setShowEmailForm(false);
    setEmail("");
    setPassword("");
    setAcceptedTerms(false);
    setError("");
    setIsLoading(false);
  }

  function switchMode(next: Mode) {
    resetForm();
    setMode(next);
  }

  function handleGoogle() {
    // Google requires a full-page redirect; bring the user back to `dest`.
    signIn("google", { callbackUrl: dest });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isSignup) {
      const check = validatePassword(password);
      if (!check.valid) {
        setError("Password doesn't meet requirements: " + check.errors[0]);
        return;
      }
      if (!acceptedTerms) {
        setError("You must agree to the Terms and Privacy Policy");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: "artist", acceptedTerms }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(
            data?.error ||
              (res.status === 409
                ? "An account with this email already exists. Try signing in instead."
                : "Failed to create account. Please try again.")
          );
          setIsLoading(false);
          return;
        }
        redditEvents.signUp();
        trackTikTokEvent("CompleteRegistration", { content_name: "artist" });
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(isSignup ? "Account created — please sign in." : "Invalid email or password");
        if (isSignup) switchMode("signin");
        setIsLoading(false);
        return;
      }

      onOpenChange(false);
      router.push(dest);
      router.refresh();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent
        className={`${mono.className} max-w-md border border-white/12 bg-[#0a0a0a] text-[#f4f4ef] shadow-[0_0_80px_rgba(110,231,255,0.10)] sm:rounded-2xl`}
      >
        <div className="font-sans">
          <DialogTitle className="text-2xl font-extrabold tracking-tight lowercase">
            {forReport
              ? isSignup
                ? "sign up to see your report"
                : "log in to see your report"
              : isSignup
              ? "create your account"
              : "welcome back"}
          </DialogTitle>
          <p className="mt-1 text-sm text-white/50">
            {forReport
              ? isSignup
                ? "your verdict’s ready — create your free account to open the full report. no card required."
                : "sign in and we’ll open the report you just started."
              : isSignup
              ? "score your track, free — no card required."
              : "sign in to your account."}
          </p>
        </div>

        {error && (
          <div className="text-[#ff8f8f] text-sm py-2.5 px-3 bg-[#ff6b6b]/10 border-l-2 border-[#ff6b6b]">
            {error}
          </div>
        )}

        {/* Google — primary path */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 h-12 bg-white text-neutral-900 font-bold rounded-md hover:bg-white/90 transition-colors"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>

        {!showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full text-center text-[13px] text-white/45 hover:text-white transition-colors"
          >
            {isSignup ? "sign up with email instead" : "use email and password instead"}
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="font-sans space-y-4">
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className={`${mono.className} relative flex justify-center text-[10px] uppercase tracking-wider`}>
                <span className="bg-[#0a0a0a] px-3 text-white/40">or with email</span>
              </div>
            </div>

            <div>
              <label htmlFor="auth-email" className="block text-[11px] font-bold text-white/45 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-3.5 py-2.5 text-[16px] text-white placeholder:text-white/30 focus:outline-none rounded-md transition-colors"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-[11px] font-bold text-white/45 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder={isSignup ? "create a strong password" : "enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-3.5 py-2.5 text-[16px] text-white placeholder:text-white/30 focus:outline-none rounded-md transition-colors"
              />
              {isSignup && (
                <div className="mt-2">
                  <PasswordStrength password={password} />
                </div>
              )}
              {!isSignup && (
                <div className="mt-2 flex justify-end">
                  <Link
                    href="/forgot-password"
                    onClick={() => onOpenChange(false)}
                    className="text-[13px] text-white/45 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {isSignup && (
              <label className="flex items-start gap-2.5 text-[13px] text-white/55 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 bg-transparent border border-white/30 accent-[#6ee7ff] cursor-pointer"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" onClick={() => onOpenChange(false)} className="text-white underline">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" onClick={() => onOpenChange(false)} className="text-white underline">Privacy Policy</Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading || (isSignup && (!acceptedTerms || !validatePassword(password).valid))}
              className="flex w-full items-center justify-center gap-2 h-12 bg-[#6ee7ff] text-black font-extrabold rounded-md hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignup ? "create account" : "sign in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="font-sans text-[13px] text-white/45 text-center">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => switchMode(isSignup ? "signin" : "signup")}
            className="text-[#6ee7ff] font-bold hover:text-white transition-colors"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}

export { ACCENT };
