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
import { Upload, MessageSquare, Clock, ArrowRight, Gift, Check } from "lucide-react";

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
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-5 py-6 sm:px-8 sm:py-8 text-white flex-shrink-0">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium text-purple-200">Welcome to MixReflect</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
              Your free trial is ready
            </DialogTitle>
            <DialogDescription className="text-purple-100 text-sm sm:text-base">
              Get honest feedback from real listeners.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-5 sm:px-8 sm:py-6 overflow-y-auto flex-1">
          {/* What's included */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              What you get
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <span className="text-sm text-neutral-700">
                  <span className="font-semibold">{freeCredits} free credits</span> to get peer reviews
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <span className="text-sm text-neutral-700">
                  <span className="font-semibold">3 track uploads</span> to your library
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <span className="text-sm text-neutral-700">
                  <span className="font-semibold">Written feedback</span> on your music
                </span>
              </div>
            </div>
          </div>

          {/* How it works - simplified for mobile */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              How it works
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center flex-1 p-2 sm:p-3 rounded-lg bg-neutral-50">
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mb-1" />
                <span className="text-[10px] sm:text-xs font-medium text-neutral-600">Upload</span>
              </div>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-300 flex-shrink-0" />
              <div className="flex flex-col items-center flex-1 p-2 sm:p-3 rounded-lg bg-neutral-50">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mb-1" />
                <span className="text-[10px] sm:text-xs font-medium text-neutral-600">Request</span>
              </div>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-300 flex-shrink-0" />
              <div className="flex flex-col items-center flex-1 p-2 sm:p-3 rounded-lg bg-neutral-50">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mb-1" />
                <span className="text-[10px] sm:text-xs font-medium text-neutral-600">24-48h</span>
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
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
          </Button>

          <p className="text-[10px] sm:text-xs text-neutral-500 text-center mt-3">
            No credit card required
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
