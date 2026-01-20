"use client";

import { Check, Sparkles, Zap } from "lucide-react";

export function ProofSection() {
  return (
    <div
      id="get-feedback-proof"
      className="space-y-6 pt-8 border-t border-neutral-800 text-left"
    >
      <div className="border-2 border-neutral-700 bg-neutral-950/30 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 bg-lime-500 text-black flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-black text-white">What you'll get</p>
            <p className="text-sm text-neutral-400">
              We combine multiple listener reviews into aggregated scores, distributions, and consensus highlights—so you can see what's consistently landing (and what isn't).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <FeatureBadge>Specific timestamps</FeatureBadge>
              <FeatureBadge>Actionable next steps</FeatureBadge>
              <FeatureBadge>Aggregated scores</FeatureBadge>
              <FeatureBadge>Consensus highlights</FeatureBadge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ExpandableSection
          icon={<Zap className="h-4 w-4 text-lime-500" />}
          title="Aggregated analytics"
          subtitle="Averages + distributions from multiple listeners"
        >
          <div className="border border-neutral-700 bg-black/30 overflow-hidden">
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-3 flex items-center gap-2">
              <div className="h-6 w-6 bg-lime-500/20 flex items-center justify-center">
                <Zap className="h-3 w-3 text-lime-500" />
              </div>
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Sample Analytics
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Production Quality</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-lime-500" />
                  </div>
                  <span className="text-sm font-bold text-white">4.2</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Originality</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-lime-500" />
                  </div>
                  <span className="text-sm font-bold text-white">3.8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Would Listen Again</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-lime-500" />
                  </div>
                  <span className="text-sm font-bold text-white">85%</span>
                </div>
              </div>
            </div>
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
}

function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-200">
      <Check className="h-3.5 w-3.5 text-lime-500" />
      {children}
    </span>
  );
}

interface ExpandableSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function ExpandableSection({ icon, title, subtitle, children }: ExpandableSectionProps) {
  return (
    <details open className="details-no-marker group border-2 border-neutral-700 bg-neutral-900">
      <summary className="cursor-pointer select-none p-4 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="font-black text-white">{title}</p>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
        </div>
        <div className="text-xs font-mono text-neutral-500 group-open:text-lime-500">
          <span className="group-open:hidden">VIEW</span>
          <span className="hidden group-open:inline">HIDE</span>
        </div>
      </summary>
      <div className="border-t border-neutral-800 p-4">
        {children}
      </div>
    </details>
  );
}
