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

function ScoreRow({ label, value }: { label: string; value: number | null }) {
  if (value === null || Number.isNaN(value)) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className="font-semibold text-white">{value}/5</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
        {value}
      </div>
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
  return (
    <details className="mt-5 rounded-lg border border-neutral-800 bg-neutral-900/30 overflow-hidden">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-white">
        Full review details
        <span className="ml-2 text-xs font-normal text-neutral-500">
          ({reviewDate})
        </span>
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Scores
          </div>
          <div className="space-y-1.5">
            <ScoreRow label="Production" value={productionScore} />
            <ScoreRow label="Originality" value={originalityScore} />
            <ScoreRow label="Vocals" value={vocalScore} />
          </div>
        </div>

        {perceivedGenre ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Perceived genre
            </div>
            <div className="mt-1 text-sm text-neutral-200">{perceivedGenre}</div>
          </div>
        ) : null}

        <TextBlock label="Best part" value={bestPart} />
        <TextBlock label="Weakest part" value={weakestPart} />
        <TextBlock label="Next actions" value={nextActions} />
      </div>
    </details>
  );
}
