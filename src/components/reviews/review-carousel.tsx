"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewDisplay, type ReviewData } from "./review-display";
import { cn } from "@/lib/utils";

type ReviewCarouselProps = {
  reviews: ReviewData[];
  showControls?: boolean;
};

export function ReviewCarousel({ reviews, showControls = true }: ReviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const totalReviews = reviews.length;

  const goToNext = useCallback(() => {
    if (isAnimating || currentIndex >= totalReviews - 1) return;
    setDirection("right");
    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isAnimating, currentIndex, totalReviews]);

  const goToPrev = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return;
    setDirection("left");
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
  }, [isAnimating, currentIndex]);

  const goToIndex = useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return;
    setDirection(index > currentIndex ? "right" : "left");
    setIsAnimating(true);
    setCurrentIndex(index);
  }, [isAnimating, currentIndex]);

  // Reset animation state
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  if (totalReviews === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
          <span className="text-xl">0</span>
        </div>
        <h3 className="font-bold text-black">No reviews yet</h3>
        <p className="text-sm text-neutral-600 mt-1">Check back soon!</p>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <div className="relative">
      {/* Header with counter and navigation */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-black/10">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono tracking-widest uppercase text-black/40">Review</span>
          <span className="text-sm font-bold tabular-nums text-black">
            {currentIndex + 1}
            <span className="text-black/30 mx-0.5">/</span>
            {totalReviews}
          </span>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none",
              currentIndex === 0
                ? "text-black/20 cursor-not-allowed"
                : "text-black/60 hover:bg-black/5 active:bg-black/10"
            )}
            aria-label="Previous review"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === totalReviews - 1}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none",
              currentIndex === totalReviews - 1
                ? "text-black/20 cursor-not-allowed"
                : "text-black/60 hover:bg-black/5 active:bg-black/10"
            )}
            aria-label="Next review"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Review content with animation */}
      <div className="relative overflow-hidden">
        <div
          className={cn(
            "transition-transform duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none",
            isAnimating && direction === "right" && "animate-slide-in-right",
            isAnimating && direction === "left" && "animate-slide-in-left"
          )}
          key={currentIndex}
        >
          <ReviewDisplay
            review={currentReview}
            index={currentIndex}
            showControls={showControls}
          />
        </div>
      </div>

      {/* Dot indicators */}
      {totalReviews > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-black/5">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-150 ease-out motion-reduce:transition-none",
                index === currentIndex
                  ? "w-5 bg-purple-500"
                  : "w-1.5 bg-black/15 hover:bg-black/25"
              )}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
