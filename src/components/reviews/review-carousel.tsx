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

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goToPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goToNext(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  if (totalReviews === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-black text-black/20 uppercase tracking-widest">No reviews yet</p>
        <p className="text-xs text-black/20 mt-1">Check back soon</p>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <div>
      {/* Minimal nav strip */}
      {totalReviews > 1 && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/8">
          <span className="text-[11px] font-mono text-black/25 tabular-nums">
            {currentIndex + 1} / {totalReviews}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className={cn(
                "h-7 w-7 flex items-center justify-center transition-colors duration-150",
                currentIndex === 0
                  ? "text-black/15 cursor-not-allowed"
                  : "text-black/30 hover:text-black"
              )}
              aria-label="Previous review"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === totalReviews - 1}
              className={cn(
                "h-7 w-7 flex items-center justify-center transition-colors duration-150",
                currentIndex === totalReviews - 1
                  ? "text-black/15 cursor-not-allowed"
                  : "text-black/30 hover:text-black"
              )}
              aria-label="Next review"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Review content */}
      <div className="relative overflow-hidden">
        <div
          className={cn(
            "transition-transform duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none",
            isAnimating && direction === "right" && "animate-slide-in-right",
            isAnimating && direction === "left" && "animate-slide-in-left"
          )}
          key={currentIndex}
        >
          <ReviewDisplay review={currentReview} index={currentIndex} showControls={showControls} />
        </div>
      </div>

      {/* Dot indicators */}
      {totalReviews > 1 && (
        <div className="flex items-center gap-1.5 pt-4 mt-4 border-t border-black/8">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "h-1 rounded-full transition-[width,background-color] duration-150 ease-out",
                index === currentIndex ? "w-4 bg-black" : "w-1 bg-black/15 hover:bg-black/30"
              )}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
