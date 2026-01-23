"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
          // Keep loading state active during navigation
          return;
        }
        setError((data as any)?.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Refresh the session to update the JWT token with isArtist = true
      // This prevents middleware from redirecting back due to stale token
      await updateSession();
      router.push("/artist/dashboard");
      router.refresh();
      // Keep loading state active during navigation
    } catch {
      setError("Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#f7f7f5]">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Welcome</h1>
          <p className="mt-2 text-neutral-500">Let&apos;s set up your artist profile</p>
          
          <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg shadow-sm">
            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3">What&apos;s next:</p>
            <ol className="text-sm text-purple-900 space-y-2 list-decimal list-inside font-medium">
              <li>Upload your first track</li>
              <li>Request your 5 free reviews</li>
              <li>Get detailed feedback in 24-48 hours</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-400 text-sm py-3 px-4 bg-red-500/10 border-l-2 border-red-500">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="artistName" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Artist Name
            </label>
            <input
              id="artistName"
              type="text"
              placeholder="Your artist or project name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              required
              className="w-full rounded-none border-0 border-b-2 border-neutral-300 px-0 py-3 text-neutral-950 text-lg placeholder:text-neutral-400 focus:border-purple-600 focus:ring-0 outline-none focus-visible:outline-none transition-[border-color] duration-200 bg-transparent"
            />
            <p className="text-sm text-neutral-500 mt-3">
              This is how you&apos;ll appear to reviewers. You can pick genres when you submit a track.
            </p>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-semibold text-base shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              isLoading={isLoading}
              disabled={!artistName.trim()}
            >
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
