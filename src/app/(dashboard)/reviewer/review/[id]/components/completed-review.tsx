"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { ArrowLeft, Music, DollarSign, Download, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Review } from "../types";
import { formatFirstImpression } from "../utils";

interface CompletedReviewProps {
  review: Review;
  hasPurchased: boolean;
  reviewerBalance: number | null;
  onPurchase: () => Promise<void>;
  onDownload: () => Promise<void>;
  isPurchasing: boolean;
  purchaseError: string;
}

export function CompletedReview({
  review,
  hasPurchased,
  reviewerBalance,
  onPurchase,
  onDownload,
  isPurchasing,
  purchaseError,
}: CompletedReviewProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/review/history"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        <div className="text-right">
          <p className="text-xs text-neutral-600 font-mono">Earned</p>
          <p className="text-lg font-black">{formatCurrency(review.paidAmount ?? 0)}</p>
        </div>
      </div>

      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
              <Music className="h-6 w-6 text-black" />
            </div>
            <div>
              <CardTitle className="text-xl">{review.Track.title}</CardTitle>
              <p className="text-sm text-neutral-600">
                {review.Track.Genre.map((g) => g.name).join(", ")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AudioPlayer
            sourceUrl={review.Track.sourceUrl}
            sourceType={review.Track.sourceType}
            showListenTracker={false}
            showWaveform={review.Track.sourceType === "UPLOAD"}
          />
        </CardContent>
      </Card>

      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <CardTitle>Your Submitted Review</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
              <span className="text-neutral-600">First impression:</span>{" "}
              <span className="font-bold">{formatFirstImpression(review.firstImpression)}</span>
            </div>
            {typeof review.productionScore === "number" && (
              <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                <span className="text-neutral-600">Production:</span>{" "}
                <span className="font-bold">{review.productionScore}/5</span>
              </div>
            )}
            {typeof review.vocalScore === "number" && (
              <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                <span className="text-neutral-600">Vocals:</span>{" "}
                <span className="font-bold">{review.vocalScore}/5</span>
              </div>
            )}
            {typeof review.originalityScore === "number" && (
              <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                <span className="text-neutral-600">Originality:</span>{" "}
                <span className="font-bold">{review.originalityScore}/5</span>
              </div>
            )}
            {review.wouldListenAgain !== null && review.wouldListenAgain !== undefined && (
              <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                <span className="text-neutral-600">Would listen again:</span>{" "}
                <span className="font-bold">{review.wouldListenAgain ? "Yes" : "No"}</span>
              </div>
            )}
          </div>

          {(review.perceivedGenre || review.similarArtists) && (
            <div className="text-sm p-3 bg-white/70 border border-black/10 rounded-2xl">
              {review.perceivedGenre && (
                <p>
                  <span className="text-neutral-600 font-medium">Perceived genre:</span>{" "}
                  <span className="font-bold">{review.perceivedGenre}</span>
                </p>
              )}
              {review.similarArtists && (
                <p className={review.perceivedGenre ? "mt-1" : ""}>
                  <span className="text-neutral-600 font-medium">Similar artists:</span>{" "}
                  <span className="font-bold">{review.similarArtists}</span>
                </p>
              )}
            </div>
          )}

          {review.bestPart && (
            <div className="bg-lime-50 border border-lime-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-lime-700 mb-2">Best Part</p>
              <p className="text-sm text-lime-900">{review.bestPart}</p>
            </div>
          )}

          {review.weakestPart && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-700 mb-2">Areas for Improvement</p>
              <p className="text-sm text-red-900">{review.weakestPart}</p>
            </div>
          )}

          {review.additionalNotes && (
            <div className="bg-white/70 border border-black/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-neutral-600 mb-2">Additional Notes</p>
              <p className="text-sm text-neutral-800">{review.additionalNotes}</p>
            </div>
          )}

          {review.timestamps && review.timestamps.length > 0 && (
            <div className="bg-white/70 border border-black/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-neutral-600 mb-2">Timestamp Notes</p>
              <div className="space-y-2">
                {review.timestamps.map((t, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-neutral-500 flex-shrink-0">
                      {Math.floor(t.seconds / 60)}:{(t.seconds % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="text-neutral-800">{t.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Card */}
      {review.Track.allowPurchase && (
        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            {hasPurchased ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-lime-100 border-2 border-lime-500 flex items-center justify-center mx-auto">
                  <DollarSign className="h-6 w-6 text-lime-700" />
                </div>
                <div>
                  <p className="font-bold text-lg">Track Purchased!</p>
                  <p className="text-sm text-neutral-600">
                    You now own this track. Download it anytime.
                  </p>
                </div>
                <Button onClick={onDownload} variant="primary" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download Track
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-lime-50 border border-lime-300 rounded-xl flex items-center justify-center mx-auto">
                  <ShoppingCart className="h-6 w-6 text-lime-700" />
                </div>
                <div>
                  <p className="font-bold text-lg">Love this track?</p>
                  <p className="text-sm text-neutral-600">
                    Purchase it for $0.50 to download and support the ArtistProfile.
                  </p>
                  {reviewerBalance !== null && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Your balance: {formatCurrency(reviewerBalance)}
                    </p>
                  )}
                </div>
                {purchaseError && (
                  <p className="text-sm text-red-600 font-medium">{purchaseError}</p>
                )}
                <Button
                  onClick={onPurchase}
                  isLoading={isPurchasing}
                  disabled={reviewerBalance !== null && reviewerBalance < 50}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase for $0.50
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
