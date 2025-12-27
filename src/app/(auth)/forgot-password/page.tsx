"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string; resetUrl?: string }
        | null;

      if (!res.ok) {
        setError(data?.error || "Something went wrong");
        return;
      }

      if (process.env.NODE_ENV !== "production" && data?.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for that email, we sent a password reset link.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          {process.env.NODE_ENV !== "production" && devResetUrl ? (
            <div className="w-full bg-neutral-50 border-2 border-black p-3 text-left text-sm">
              <p className="font-bold mb-1">Dev reset link</p>
              <a
                href={devResetUrl}
                className="break-all underline underline-offset-4"
              >
                {devResetUrl}
              </a>
            </div>
          ) : null}
          <Link href="/login" className="w-full">
            <Button className="w-full">Back to login</Button>
          </Link>
          <button
            type="button"
            className="text-sm text-neutral-600 hover:text-black font-medium"
            onClick={() => {
              setSuccess(false);
              setEmail("");
              setDevResetUrl("");
            }}
          >
            Use a different email
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send reset link
          </Button>
          <Link href="/login" className="text-sm text-neutral-600 hover:text-black font-medium">
            &larr; Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
