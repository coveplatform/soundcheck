"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Music, Headphones, Users, ArrowLeft, Loader2 } from "lucide-react";
import { funnels, track } from "@/lib/analytics";

type Role = "artist" | "reviewer" | "both";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const handleRoleSelect = (selectedRole: Role) => {
    funnels.artistSignup.selectRole(selectedRole);
    setRole(selectedRole);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

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

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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

  if (step === "role") {
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
          <CardTitle className="text-2xl">Join MixReflect</CardTitle>
          <CardDescription>
            How do you want to use MixReflect?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => handleRoleSelect("artist")}
            className="w-full p-4 border-2 border-black bg-white hover:bg-lime-400 transition-colors text-left flex items-start gap-4 group"
          >
            <div className="p-2 bg-black text-white group-hover:bg-black">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">I&apos;m an Artist</h3>
              <p className="text-sm text-neutral-600">
                Get genuine feedback on your tracks before release
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("reviewer")}
            className="w-full p-4 border-2 border-black bg-white hover:bg-orange-400 transition-colors text-left flex items-start gap-4 group"
          >
            <div className="p-2 bg-black text-white group-hover:bg-black">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">I&apos;m a Reviewer</h3>
              <p className="text-sm text-neutral-600">
                Get paid to discover new music and share feedback
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("both")}
            className="w-full p-4 border-2 border-black bg-white hover:bg-neutral-100 transition-colors text-left flex items-start gap-4 group"
          >
            <div className="p-2 bg-black text-white group-hover:bg-black">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">Both</h3>
              <p className="text-sm text-neutral-600">
                Submit tracks and review others&apos; music
              </p>
            </div>
          </button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-neutral-600 text-center w-full">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <button
          type="button"
          onClick={() => setStep("role")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-4 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          {role === "artist" && "Start getting feedback on your music"}
          {role === "reviewer" && "Start discovering and reviewing music"}
          {role === "both" && "Submit tracks and review music"}
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
            <Label htmlFor="name" className="font-bold">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="flex items-start gap-3 pt-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 border-2 border-black accent-lime-400"
            />
            <label htmlFor="terms" className="text-sm text-neutral-600">
              I agree to the{" "}
              <Link href="/terms" className="text-black font-bold hover:underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-black font-bold hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={!acceptedTerms}
          >
            Create account
          </Button>
          <p className="text-sm text-neutral-600 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
