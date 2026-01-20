"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface StepArtistProps {
  artistName: string;
  setArtistName: (name: string) => void;
  isCreating: boolean;
  onSubmit: () => void;
}

export function StepArtist({ artistName, setArtistName, isCreating, onSubmit }: StepArtistProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Welcome! What&apos;s your artist name?</h1>
        <p className="mt-2 text-sm text-black/40">This is how you&apos;ll appear to reviewers</p>
      </div>

      <Card variant="soft" elevated className="flex-1">
        <CardContent className="pt-6">
          <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">artist name</p>
          <Input
            id="artistName"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Your artist or project name"
            className="h-12 rounded-xl border-black/10 bg-white/60 focus:bg-white"
            autoFocus
          />
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button
          onClick={onSubmit}
          disabled={!artistName.trim() || isCreating}
          isLoading={isCreating}
          variant="airyPrimary"
          className="w-full h-12"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
