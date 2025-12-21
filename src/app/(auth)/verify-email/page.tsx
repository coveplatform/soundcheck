"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
    }
  };

  if (status === "verifying") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verifying…</CardTitle>
          <CardDescription>Please wait a moment.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "verified") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email verified</CardTitle>
          <CardDescription>You can now sign in and start using SoundCheck.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Continue to login</Button>
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
          We sent you a verification link. If you can’t find it, resend below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {status === "resent" ? (
          <p className="text-sm text-neutral-500">
            If that email exists, a new verification link has been sent.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={resend} className="w-full">
          Resend verification
        </Button>
        <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-900">
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
