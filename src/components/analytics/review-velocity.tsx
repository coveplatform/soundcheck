"use client";

import { Clock, Zap, TrendingUp, Calendar } from "lucide-react";

interface ReviewVelocityProps {
  avgTimeToComplete: number; // in days
  fastestTrack: {
    title: string;
    days: number;
  } | null;
  slowestTrack: {
    title: string;
    days: number;
  } | null;
  reviewsPerWeek: number;
  totalReviews: number;
}

function formatDays(days: number): string {
  const clamped = Math.max(0, days);
  if (clamped < 1) return "< 1";
  return clamped.toFixed(1);
}

export function ReviewVelocity({
  avgTimeToComplete,
  fastestTrack,
  slowestTrack,
  reviewsPerWeek,
  totalReviews,
}: ReviewVelocityProps) {
  const safeAvg = Math.max(0, avgTimeToComplete);
  const safeFastest = fastestTrack && fastestTrack.days >= 0.01 ? fastestTrack : null;
  return (
    <div className="space-y-4">
      {/* Main metric */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-1">
              Avg Review Time
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black">{formatDays(safeAvg)}</p>
              <p className="text-lg text-black/60">days</p>
            </div>
            <p className="text-sm text-black/60 mt-1">
              Average time to complete all reviews on a track
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-black/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-black/40" />
            <p className="text-xs font-mono text-black/40 uppercase">Fastest Track</p>
          </div>
          {safeFastest ? (
            <>
              <p className="text-2xl font-black mb-1">{formatDays(safeFastest.days)} days</p>
              <p className="text-xs text-black/60 truncate">{safeFastest.title}</p>
            </>
          ) : (
            <p className="text-sm text-black/40">No data yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-black/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-black/40" />
            <p className="text-xs font-mono text-black/40 uppercase">Reviews/Week</p>
          </div>
          <p className="text-2xl font-black mb-1">{reviewsPerWeek.toFixed(1)}</p>
          <p className="text-xs text-black/60">Current rate</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-black/5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-black/40" />
            <p className="text-xs font-mono text-black/40 uppercase">Total Reviews</p>
          </div>
          <p className="text-2xl font-black mb-1">{totalReviews}</p>
          <p className="text-xs text-black/60">All time</p>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl p-4 border-2 border-black/5">
        <p className="text-xs font-mono text-black/40 uppercase mb-3">Quick Insights</p>
        <div className="space-y-2">
          {safeAvg > 0 && safeAvg < 3 && (
            <div className="flex items-start gap-2">
              <span className="text-lime-600 font-black">•</span>
              <p className="text-sm text-black/70">
                Lightning fast! Your tracks get reviewed in under 3 days on average.
              </p>
            </div>
          )}
          {safeAvg >= 3 && safeAvg <= 7 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-black">•</span>
              <p className="text-sm text-black/70">
                Good pace! Reviews typically complete within a week.
              </p>
            </div>
          )}
          {reviewsPerWeek > 10 && (
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-black">•</span>
              <p className="text-sm text-black/70">
                High activity! You're getting {reviewsPerWeek.toFixed(0)} reviews per week.
              </p>
            </div>
          )}
          {safeFastest && safeFastest.days <= 2 && (
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-black">•</span>
              <p className="text-sm text-black/70">
                &ldquo;{safeFastest.title}&rdquo; got reviews in just {formatDays(safeFastest.days)} days - your fastest yet!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
