"use client";

import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);

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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your SoundCheck account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
              {error}
              {needsVerificationEmail ? (
                <div className="mt-2">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(
                      needsVerificationEmail
                    )}`}
                    className="underline underline-offset-4"
                  >
                    Resend verification email
                  </Link>
                </div>
              ) : null}
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
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
          <Link
            href="/forgot-password"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Forgot password?
          </Link>
          <p className="text-sm text-neutral-500 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-neutral-900 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
