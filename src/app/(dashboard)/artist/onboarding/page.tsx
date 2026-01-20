"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [artistName, setArtistName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!artistName.trim()) {
      setError("Please enter your artist name");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/artist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: artistName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent("/artist/onboarding")}`);
          router.refresh();
          return;
        }
        setError((data as any)?.error || "Something went wrong");
        return;
      }

      // Refresh the session to update the JWT token with isArtist = true
      // This prevents middleware from redirecting back due to stale token
      await updateSession();
      router.push("/artist/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Welcome</h1>
        <p className="mt-2 text-sm text-black/40">Let&apos;s set up your artist profile</p>
      </div>

      <Card variant="soft" elevated>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">artist name</p>
              <Input
                id="artistName"
                placeholder="Your artist or project name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="h-12 rounded-xl border-black/10 bg-white/60 focus:bg-white"
              />
              <p className="text-sm text-black/40">
                This is how you&apos;ll appear to reviewers. You can pick genres when you submit a track.
              </p>
            </div>

            <Button
              type="submit"
              variant="airyPrimary"
              className="w-full h-12"
              isLoading={isLoading}
              disabled={!artistName.trim()}
            >
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
