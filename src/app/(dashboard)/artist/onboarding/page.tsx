"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
        const data = await response.json();
        setError(data.error || "Something went wrong");
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Set Up Your Artist Profile</CardTitle>
          <CardDescription>
            Add your artist / project name. You can pick genres later when you submit a track.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="artistName">Artist / Project Name</Label>
              <Input
                id="artistName"
                placeholder="Your artist name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
              />
              <p className="text-sm text-neutral-500">
                This is how you&apos;ll appear to reviewers
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!artistName.trim()}
            >
              Complete Setup
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
