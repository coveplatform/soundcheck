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
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-neutral-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-neutral-600">Review</span>
          <div className="flex items-center gap-1 bg-black text-white px-3 py-1 font-mono text-sm font-bold">
            <span>{currentIndex + 1}</span>
            <span className="text-neutral-400">/</span>
            <span>{totalReviews}</span>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={cn(
              "h-10 w-10 flex items-center justify-center border-2 border-black transition-all",
              currentIndex === 0
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            )}
            aria-label="Previous review"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === totalReviews - 1}
            className={cn(
              "h-10 w-10 flex items-center justify-center border-2 border-black transition-all",
              currentIndex === totalReviews - 1
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            )}
            aria-label="Next review"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Review content with animation */}
      <div className="relative overflow-hidden">
        <div
          className={cn(
            "transition-all duration-300 ease-out",
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
      <div className="flex items-center justify-center gap-1.5 py-4 border-t border-neutral-200 bg-neutral-50">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-200",
              index === currentIndex
                ? "w-6 bg-black"
                : "w-2 bg-neutral-300 hover:bg-neutral-400"
            )}
            aria-label={`Go to review ${index + 1}`}
          />
        ))}
      </div>

      {/* Quick stats bar */}
      <div className="flex items-center justify-center gap-6 py-3 px-6 bg-black text-white text-xs font-mono">
        {currentReview.productionScore && (
          <span>
            Production: <strong>{currentReview.productionScore}/5</strong>
          </span>
        )}
        {currentReview.originalityScore && (
          <span>
            Originality: <strong>{currentReview.originalityScore}/5</strong>
          </span>
        )}
        {currentReview.wouldListenAgain !== null && (
          <span className={currentReview.wouldListenAgain ? "text-lime-400" : "text-neutral-400"}>
            {currentReview.wouldListenAgain ? "Would listen again" : "Wouldn't replay"}
          </span>
        )}
      </div>
    </div>
  );
}
