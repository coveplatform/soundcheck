"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type ExpandableDetailsProps = {
  productionScore: number | null;
  originalityScore: number | null;
  vocalScore: number | null;
  bestPart: string | null;
  weakestPart: string | null;
  nextActions: string | null;
  perceivedGenre: string | null;
  reviewDate: string;
};

function ScoreRow({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0">
      <span className="text-neutral-600 text-sm">{label}</span>
      <span className="font-bold">{score}/5</span>
    </div>
  );
}

function TextBlock({ label, icon, value }: { label: string; icon: string; value: string | null }) {
  if (!value) return null;

  const iconColors: Record<string, string> = {
    "+": "bg-lime-500",
    "→": "bg-orange-400",
    "!": "bg-sky-400",
  };

  return (
    <div className="p-4 border-b-2 border-black last:border-0">
      <div className="flex items-start gap-2 mb-2">
        <span className={`w-6 h-6 ${iconColors[icon] || "bg-neutral-200"} border border-black flex items-center justify-center text-xs font-bold flex-shrink-0`}>
          {icon}
        </span>
        <h4 className="font-bold text-sm">{label}</h4>
      </div>
      <p className="text-neutral-600 text-sm leading-relaxed pl-8 whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

export function ExpandableDetails({
  productionScore,
  originalityScore,
  vocalScore,
  bestPart,
  weakestPart,
  nextActions,
  perceivedGenre,
  reviewDate,
}: ExpandableDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasScores = productionScore !== null || originalityScore !== null || vocalScore !== null;
  const hasDetails = weakestPart || nextActions;

  if (!hasScores && !hasDetails) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-neutral-600 hover:text-black transition-colors border-2 border-black bg-white hover:bg-neutral-50"
      >
        <span>{isExpanded ? "Hide Details" : "View Full Review"}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Score Breakdown */}
          {hasScores && (
            <div className="p-4 border-b-2 border-black">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Score Breakdown</h3>
              <ScoreRow label="Production Quality" score={productionScore} />
              <ScoreRow label="Originality" score={originalityScore} />
              <ScoreRow label="Vocal Performance" score={vocalScore} />
            </div>
          )}

          {/* Genre */}
          {perceivedGenre && (
            <div className="p-4 border-b-2 border-black bg-neutral-50">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Sounds Like: </span>
              <span className="text-sm font-medium">{perceivedGenre}</span>
            </div>
          )}

          {/* Areas to Improve */}
          <TextBlock label="Room to Grow" icon="→" value={weakestPart} />

          {/* Next Steps */}
          <TextBlock label="Next Steps" icon="!" value={nextActions} />

          {/* Review Date */}
          <div className="p-3 bg-neutral-100 border-t-2 border-black text-center text-xs text-neutral-500">
            Reviewed on {reviewDate}
          </div>
        </div>
      )}
    </div>
  );
}
