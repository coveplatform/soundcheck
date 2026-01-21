"use client";

import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackPatternsProps {
  commonPraise: Array<{ word: string; count: number }>;
  commonCritiques: Array<{ word: string; count: number }>;
  improvingAreas: string[];
  consistentStrengths: string[];
}

export function FeedbackPatterns({
  commonPraise,
  commonCritiques,
  improvingAreas,
  consistentStrengths,
}: FeedbackPatternsProps) {
  return (
    <div className="space-y-6">
      {/* Common praise and critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Praise */}
        <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl p-6 border-2 border-lime-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-mono text-black/40 uppercase tracking-widest">
                What Reviewers Love
              </p>
              <p className="text-sm font-bold text-black/80">
                Most mentioned strengths
              </p>
            </div>
          </div>

          {commonPraise.length > 0 ? (
            <div className="space-y-2">
              {commonPraise.slice(0, 8).map((item, index) => (
                <div
                  key={item.word}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-lime-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-lime-600">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">{item.word}</span>
                  </div>
                  <span className="text-xs font-mono text-black/40">
                    {item.count}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/40 text-center py-8">
              Need more reviews to identify patterns
            </p>
          )}
        </div>

        {/* Critiques */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-mono text-black/40 uppercase tracking-widest">
                Areas to Focus On
              </p>
              <p className="text-sm font-bold text-black/80">
                Most mentioned improvements
              </p>
            </div>
          </div>

          {commonCritiques.length > 0 ? (
            <div className="space-y-2">
              {commonCritiques.slice(0, 8).map((item, index) => (
                <div
                  key={item.word}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-600">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">{item.word}</span>
                  </div>
                  <span className="text-xs font-mono text-black/40">
                    {item.count}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/40 text-center py-8">
              Need more reviews to identify patterns
            </p>
          )}
        </div>
      </div>

      {/* Trends */}
      {(improvingAreas.length > 0 || consistentStrengths.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Improving areas */}
          {improvingAreas.length > 0 && (
            <div className="bg-white rounded-xl p-6 border-2 border-black/5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-bold">Improving Over Time</p>
              </div>
              <div className="space-y-2">
                {improvingAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center gap-2 text-sm text-black/70"
                  >
                    <span className="text-blue-600 font-black">↗</span>
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consistent strengths */}
          {consistentStrengths.length > 0 && (
            <div className="bg-white rounded-xl p-6 border-2 border-black/5">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-lime-600" />
                <p className="text-sm font-bold">Consistent Strengths</p>
              </div>
              <div className="space-y-2">
                {consistentStrengths.map((strength) => (
                  <div
                    key={strength}
                    className="flex items-center gap-2 text-sm text-black/70"
                  >
                    <span className="text-lime-600 font-black">✓</span>
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
