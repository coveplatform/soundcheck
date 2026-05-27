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
      <div className="text-center py-12 px-6">
        <div className="mx-auto w-12 h-12 bg-black/5 border-2 border-black flex items-center justify-center mb-4">
          <span className="text-xl font-black">0</span>
        </div>
        <h3 className="font-black text-black">No reviews yet</h3>
        <p className="text-sm text-black/40 mt-1">Check back soon!</p>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <div>
      {/* Header — solid black bar */}
      <div className="flex items-center justify-between bg-black px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Review</span>
          <span className="text-sm font-black tabular-nums text-white">
            {currentIndex + 1}
            <span className="text-white/30 mx-1">/</span>
            {totalReviews}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={cn(
              "h-8 w-8 flex items-center justify-center transition-colors duration-150",
              currentIndex === 0
                ? "text-white/20 cursor-not-allowed"
                : "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20"
            )}
            aria-label="Previous review"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === totalReviews - 1}
            className={cn(
              "h-8 w-8 flex items-center justify-center transition-colors duration-150",
              currentIndex === totalReviews - 1
                ? "text-white/20 cursor-not-allowed"
                : "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20"
            )}
            aria-label="Next review"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Review content */}
      <div className="relative overflow-hidden bg-white">
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
        <div className="flex items-center justify-center gap-1.5 py-3 border-t-2 border-black/8 bg-white">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-150 ease-out",
                index === currentIndex ? "w-5 bg-black" : "w-1.5 bg-black/20 hover:bg-black/40"
              )}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
