"use client";

import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
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

  useEffect(() => {
    if (!authError) return;
    if (authError === "EmailNotVerified") {
      setError("Please verify your email before signing in.");
      return;
    }

    if (authError === "CredentialsSignin") {
      setError("Invalid email or password");
      return;
    }

    if (authError.startsWith("TooManyAttempts")) {
      setError("Too many login attempts. Please try again later.");
      return;
    }

    setError("Sign in failed");
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerificationEmail(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result) {
        setError("Sign in failed");
        return;
      }

      if (result?.error) {
        if (result.error === "EmailNotVerified") {
          setNeedsVerificationEmail(email);
          setError("Please verify your email before signing in.");
        } else if (result.error.startsWith("TooManyAttempts:")) {
          const seconds = result.error.split(":")[1];
          setError(`Too many login attempts. Please try again in ${seconds} seconds.`);
        } else {
          setError("Invalid email or password");
        }
      } else {
        const session = await getSession();
        const defaultUrl = session?.user?.isArtist
          ? "/artist/dashboard"
          : session?.user?.isReviewer
          ? "/reviewer/dashboard"
          : "/";
        const target = callbackUrl && callbackUrl !== "/" ? callbackUrl : defaultUrl;
        router.push(target);
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
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
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-950 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Welcome back</h1>
        <p className="mt-2 text-neutral-500">Sign in to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-400 text-sm py-3 px-4 bg-red-500/10 border-l-2 border-red-500">
            {error}
            {needsVerificationEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(needsVerificationEmail)}`}
                className="block mt-2 underline underline-offset-4 hover:text-red-300"
              >
                Resend verification email
              </Link>
            )}
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
            className="w-full rounded-none border-0 border-b-2 border-neutral-300 px-0 py-3 text-neutral-950 text-lg placeholder:text-neutral-400 focus:border-lime-600 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-none border-0 border-b-2 border-neutral-300 px-0 py-3 text-neutral-950 text-lg placeholder:text-neutral-400 focus:border-lime-600 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 bg-transparent"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-12 bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-black text-base border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none"
            isLoading={isLoading}
          >
            Sign in
            {callbackUrl && callbackUrl !== "/" ? (
              <span className="ml-2 text-xs font-mono opacity-70">→ redirect</span>
            ) : null}
          </Button>
        </div>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#f7f7f5] px-4 text-neutral-500">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-white border-2 border-neutral-300 text-neutral-950 hover:bg-neutral-100 hover:border-neutral-400 font-bold transition-colors duration-150 ease-out motion-reduce:transition-none"
        onClick={() => signIn("google", { callbackUrl })}
      >
        <GoogleIcon className="h-5 w-5 mr-2" />
        Continue with Google
      </Button>

      <p className="text-sm text-neutral-600 text-center mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-neutral-950 font-bold hover:text-lime-700 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
