"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export default function TrialLandingPage() {
  const router = useRouter();
  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="text-white" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Get an aggregated feedback report on your track.
          </h1>
          <p className="text-neutral-300 text-base sm:text-lg max-w-xl mx-auto">
            Genre-matched listeners leave structured reviews. MixReflect aggregates patterns into a clear summary so you know what to fix.
          </p>
        </div>

        <div className="mt-6 border-2 border-neutral-700 bg-neutral-900 p-4">
          {error && (
            <div className="mb-4 bg-red-500/20 border-2 border-red-500 text-red-300 text-sm p-3 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Input
              placeholder="Artist name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="h-11 bg-neutral-800 border-2 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-lime-500"
            />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-neutral-800 border-2 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-lime-500"
            />

            <Button
              type="button"
              className="w-full h-11 text-base font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400"
              disabled={isLoading}
              onClick={async () => {
                setError("");
                const nextArtistName = artistName.trim();
                const nextEmail = email.trim().toLowerCase();

                if (!nextArtistName) {
                  setError("Please enter your artist name");
                  return;
                }
                if (!nextEmail) {
                  setError("Please enter your email");
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
                  setError("Please enter a valid email");
                  return;
                }

                setIsLoading(true);
                try {
                  // Best-effort lead capture
                  fetch("/api/lead-capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: nextEmail,
                      artistName: nextArtistName,
                      source: "t",
                      sendEmail: false,
                    }),
                  }).catch(() => null);

                  const res = await fetch("/api/auth/trial-signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: nextEmail, artistName: nextArtistName }),
                  });
                  const data = await res.json().catch(() => ({}));

                  if (!res.ok) {
                    if (data?.code === "EMAIL_EXISTS") {
                      router.push(
                        `/login?email=${encodeURIComponent(nextEmail)}&callbackUrl=${encodeURIComponent(
                          "/artist/onboarding"
                        )}`
                      );
                      return;
                    }
                    setError(data?.error || "Couldn't start trial. Please try again.");
                    return;
                  }

                  const password = data?.temporaryPassword as string | undefined;
                  if (!password) {
                    setError("Couldn't start trial. Please try again.");
                    return;
                  }

                  const result = await signIn("credentials", {
                    email: nextEmail,
                    password,
                    callbackUrl: "/artist/onboarding",
                    redirect: false,
                  });

                  if (result?.error) {
                    setError("Couldn't sign you in. Please try logging in.");
                    router.push(
                      `/login?email=${encodeURIComponent(nextEmail)}&callbackUrl=${encodeURIComponent(
                        "/artist/onboarding"
                      )}`
                    );
                    return;
                  }

                  router.push(result?.url || "/artist/onboarding");
                  router.refresh();
                } catch {
                  setError("Couldn't start trial. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  Start trial
                  <ArrowRight className="h-4 w-4 ml-2" />
                </span>
              )}
            </Button>
          </div>

          <div className="mt-5 grid gap-2 text-sm text-neutral-300">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-lime-500 mt-0.5 flex-shrink-0" />
              <span>Create your account instantly</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-lime-500 mt-0.5 flex-shrink-0" />
              <span>Finish setup (genres) in onboarding</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-lime-500 mt-0.5 flex-shrink-0" />
              <span>Submit your track from the dashboard</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
