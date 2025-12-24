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
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email verified</CardTitle>
          <CardDescription>You can now sign in and start using MixReflect.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="primary" className="w-full">Continue to login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We sent you a verification link. Check your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
            {error}
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
        {status === "resent" ? (
          <p className="text-sm text-neutral-600 bg-lime-100 border-2 border-lime-400 p-3">
            If that email exists, a new verification link has been sent.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={resend} className="w-full" isLoading={isResending}>
          Resend verification
        </Button>
        <Link href="/login" className="text-sm text-neutral-600 hover:text-black font-medium">
          &larr; Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
