"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";

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
import { Music, Headphones, Users, ArrowLeft, Loader2 } from "lucide-react";
import { funnels, track } from "@/lib/analytics";
import { trackTikTokEvent } from "@/components/providers";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validatePassword } from "@/lib/password";

type Role = "artist" | "reviewer" | "both";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralSource, setReferralSource] = useState("");
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

    // Redirect artists to the new step-by-step flow
    if (selectedRole === "artist") {
      router.push("/get-feedback");
      return;
    }

    setRole(selectedRole);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    // Validate password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError("Password doesn't meet requirements: " + passwordValidation.errors[0]);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
        body: JSON.stringify({ email, password, name, role, acceptedTerms, referralSource: referralSource || undefined }),
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
            className="w-full p-4 border-2 border-black bg-white hover:bg-lime-400 active:bg-lime-500 active:scale-[0.98] transition-all active:transition-none text-left flex items-start gap-4 group"
          >
            <div className="p-2 bg-black text-white">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">I&apos;m an Artist</h3>
              <p className="text-sm text-neutral-600">
                Get genuine feedback on your tracks before release
              </p>
            </div>
          </button>

          <div
            className="w-full p-4 border-2 border-neutral-300 bg-neutral-50 text-left flex items-start gap-4 cursor-not-allowed opacity-60"
          >
            <div className="p-2 bg-neutral-400 text-white">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-500">I&apos;m a Reviewer</h3>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-500 px-2 py-0.5">
                  WAITLIST FULL
                </span>
              </div>
              <p className="text-sm text-neutral-400">
                We&apos;re not accepting new reviewers right now
              </p>
            </div>
          </div>

          <div
            className="w-full p-4 border-2 border-neutral-300 bg-neutral-50 text-left flex items-start gap-4 cursor-not-allowed opacity-60"
          >
            <div className="p-2 bg-neutral-400 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-500">Both</h3>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-500 px-2 py-0.5">
                  WAITLIST FULL
                </span>
              </div>
              <p className="text-sm text-neutral-400">
                Reviewer signups paused — artist signups open
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
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
            onClick={() => signIn("google", { callbackUrl: "/get-feedback" })}
          >
            <GoogleIcon className="h-5 w-5 mr-2" />
            Continue with Google
          </Button>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold">First name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Sarah"
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-bold">Confirm</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && password.length > 0 && (
                <p className="text-xs text-green-600 font-medium">Passwords match</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralSource" className="font-bold">How did you hear about us? <span className="font-normal text-neutral-400">(optional)</span></Label>
            <select
              id="referralSource"
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className="w-full h-10 px-3 border-2 border-black bg-white text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
            >
              <option value="">Select an option...</option>
              <option value="reddit">Reddit</option>
              <option value="twitter">Twitter / X</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="discord">Discord</option>
              <option value="forum">Music forum</option>
              <option value="friend">Friend or colleague</option>
              <option value="search">Google search</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-start gap-3">
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
            disabled={
              !acceptedTerms ||
              !validatePassword(password).valid ||
              password !== confirmPassword
            }
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
