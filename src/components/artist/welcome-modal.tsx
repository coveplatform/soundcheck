"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare, BarChart3, ArrowRight, Gift, Check } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onDismiss: () => void;
  freeCredits: number;
}

export function WelcomeModal({ open, onDismiss, freeCredits }: WelcomeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    // Fire and forget - don't block the user if the API fails
    fetch("/api/artist/welcome-seen", { method: "POST" }).catch(() => {
      // Silently ignore errors - user experience is more important
    });
    // Always dismiss immediately for smooth UX
    onDismiss();
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleGetStarted()}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-6 py-8 sm:px-8 sm:py-10 text-white">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <span className="text-sm font-medium text-purple-200">Welcome to MixReflect</span>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Your free trial is ready
            </DialogTitle>
            <DialogDescription className="text-purple-100 text-base sm:text-lg">
              Get honest feedback from real listeners and improve your music.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          {/* What's included */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              Your free trial includes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-neutral-700">
                  <span className="font-semibold">{freeCredits} free review credits</span> to get feedback
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-neutral-700">
                  <span className="font-semibold">3 track uploads</span> to your library
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-neutral-700">
                  <span className="font-semibold">Detailed analytics</span> on your feedback
                </span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              How it works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-neutral-50">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-3">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-600 mb-1">Step 1</span>
                <span className="text-sm font-medium text-neutral-800">Upload your track</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-neutral-50">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-600 mb-1">Step 2</span>
                <span className="text-sm font-medium text-neutral-800">Request reviews</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-neutral-50">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-600 mb-1">Step 3</span>
                <span className="text-sm font-medium text-neutral-800">Get feedback in 24-48h</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleGetStarted}
            isLoading={isLoading}
          >
            Get started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <p className="text-xs text-neutral-500 text-center mt-4">
            No credit card required. Upgrade anytime for unlimited uploads.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
