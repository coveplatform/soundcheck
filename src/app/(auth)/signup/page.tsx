"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import Link from "next/link";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { funnels, track } from "@/lib/analytics";
import { trackTikTokEvent } from "@/components/providers";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validatePassword } from "@/lib/password";

type Role = "artist" | "reviewer" | "both";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "";
  const role: Role = "artist";

  const [name, setName] = useState(searchParams.get("name") || "");
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
        body: JSON.stringify({ email, password, name, role, acceptedTerms }),
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
      track("email_verification_sent");
      // TikTok conversion tracking
      trackTikTokEvent("CompleteRegistration", {
        content_name: role,
      });

      const verifyUrl = callbackUrl
        ? `/verify-email?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
        : `/verify-email?email=${encodeURIComponent(email)}`;
      router.push(verifyUrl);
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
      <Card className="w-full border-2 border-black bg-neutral-900 text-white shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            <p className="text-sm text-neutral-400">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-black bg-neutral-900 text-white shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
      <CardHeader className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-300 hover:text-white transition-colors mb-4 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <CardTitle className="text-2xl font-black">Start your trial</CardTitle>
        <CardDescription className="text-neutral-300">Artist name, email, and password. That&apos;s it.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/15 border-2 border-red-500 text-red-200 text-sm p-3 font-bold">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-white">Artist / Project name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your artist name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-2 border-black bg-black text-white placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 border-black bg-black text-white placeholder:text-neutral-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-2 border-black bg-black text-white placeholder:text-neutral-500"
            />
            <PasswordStrength password={password} />
          </div>
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 border-2 border-black accent-lime-400"
            />
            <label htmlFor="terms" className="text-sm text-neutral-300">
              I agree to the{" "}
              <Link href="/terms" className="text-white font-bold hover:underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-white font-bold hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none"
            isLoading={isLoading}
            disabled={!acceptedTerms || !validatePassword(password).valid}
          >
            Create account
          </Button>
          <p className="text-sm text-neutral-300 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
