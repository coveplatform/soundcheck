"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const initialEmail = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<
    "idle" | "verifying" | "verified" | "error" | "resent"
  >(token ? "verifying" : "idle");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) return;

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setStatus("error");
          setError(data?.error || "Verification failed");
          return;
        }

        setStatus("verified");
      } catch {
        setStatus("error");
        setError("Verification failed");
      }
    }

    void verify();
  }, [token]);

  const resend = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsResending(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to resend verification");
        return;
      }

      setStatus("resent");
    } catch {
      setError("Failed to resend verification");
    } finally {
      setIsResending(false);
    }
  };

  if (status === "verifying") {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700">Verifying your email...</p>
            <p className="text-xs text-neutral-500">Please wait a moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "verified") {
    const loginHref = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email verified</CardTitle>
          <CardDescription>You can now sign in and start using MixReflect.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href={loginHref} className="w-full">
            <Button variant="primary" className="w-full">Continue to login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to{" "}
          {initialEmail ? <span className="font-semibold text-neutral-800">{initialEmail}</span> : "your email"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-purple-50 border-2 border-purple-500 p-3 space-y-1">
          <p className="text-sm font-semibold text-purple-800">Verification email sent!</p>
          <p className="text-xs text-purple-700">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>
        </div>

        <div className="bg-neutral-100 border-2 border-neutral-300 p-3 space-y-1">
          <p className="text-sm font-semibold text-neutral-700">Can&apos;t find the email?</p>
          <ul className="text-xs text-neutral-600 list-disc list-inside space-y-0.5">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email</li>
            <li>Wait a minute, then try resending below</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
            {error}
          </div>
        )}

        {status === "resent" && (
          <div className="bg-purple-100 border-2 border-purple-500 p-3">
            <p className="text-sm font-semibold text-purple-800">New email sent!</p>
            <p className="text-xs text-purple-700">
              If that email exists in our system, a new verification link has been sent.
            </p>
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
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={resend} className="w-full" isLoading={isResending}>
          Resend verification email
        </Button>
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="text-sm text-neutral-600 hover:text-black font-medium"
        >
          &larr; Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
