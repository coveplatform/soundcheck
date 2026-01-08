"use client";

import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm text-neutral-500">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-4 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your MixReflect account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {error}
              {needsVerificationEmail ? (
                <div className="mt-2">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(
                      needsVerificationEmail
                    )}`}
                    className="underline underline-offset-4 hover:text-red-800"
                  >
                    Resend verification email
                  </Link>
                </div>
              ) : null}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <GoogleIcon className="h-5 w-5 mr-2" />
            Continue with Google
          </Button>

          <Link
            href="/forgot-password"
            className="text-sm text-neutral-600 hover:text-black font-medium"
          >
            Forgot password?
          </Link>
          <p className="text-sm text-neutral-600 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-black font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
