"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface ReleaseDecisionFormProps {
  trackId: string;
  trackTitle: string;
  listenTime: number;
  minListenTime: number;
  onSubmit: (data: ReleaseDecisionFormData) => Promise<void>;
  isSubmitting: boolean;
}

export interface ReleaseDecisionFormData {
  releaseVerdict: "RELEASE_NOW" | "FIX_FIRST" | "NEEDS_WORK";
  releaseReadinessScore: number;
  topFixRank1: string;
  topFixRank1Impact: "HIGH" | "MEDIUM" | "LOW";
  topFixRank1TimeMin: number;
  topFixRank2: string;
  topFixRank2Impact: "HIGH" | "MEDIUM" | "LOW";
  topFixRank2TimeMin: number;
  topFixRank3: string;
  topFixRank3Impact: "HIGH" | "MEDIUM" | "LOW";
  topFixRank3TimeMin: number;
  strongestElement: string;
  biggestRisk: string;
  competitiveBenchmark: string;
  qualityLevel: "NOT_READY" | "DEMO_STAGE" | "ALMOST_THERE" | "RELEASE_READY" | "PROFESSIONAL";
}

export function ReleaseDecisionForm({
  trackId,
  trackTitle,
  listenTime,
  minListenTime,
  onSubmit,
  isSubmitting,
}: ReleaseDecisionFormProps) {
  const [verdict, setVerdict] = useState<"RELEASE_NOW" | "FIX_FIRST" | "NEEDS_WORK" | null>(null);
  const [readinessScore, setReadinessScore] = useState(50);
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);

  // Top 3 Fixes
  const [fix1, setFix1] = useState("");
  const [fix1Impact, setFix1Impact] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [fix1Time, setFix1Time] = useState(15);

  const [fix2, setFix2] = useState("");
  const [fix2Impact, setFix2Impact] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [fix2Time, setFix2Time] = useState(10);

  const [fix3, setFix3] = useState("");
  const [fix3Impact, setFix3Impact] = useState<"HIGH" | "MEDIUM" | "LOW">("LOW");
  const [fix3Time, setFix3Time] = useState(5);

  const [strongestElement, setStrongestElement] = useState("");
  const [biggestRisk, setBiggestRisk] = useState("");
  const [benchmark, setBenchmark] = useState("");

  const [errors, setErrors] = useState<string[]>([]);

  // Refs for scrolling to errors
  const verdictRef = useRef<HTMLDivElement>(null);
  const fix1Ref = useRef<HTMLDivElement>(null);
  const strongestRef = useRef<HTMLDivElement>(null);
  const riskRef = useRef<HTMLDivElement>(null);

  const canSubmit = listenTime >= minListenTime;

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!verdict) newErrors.push("Please select a release verdict");
    if (!qualityLevel) newErrors.push("Please select a quality level");
    if (fix1.trim().length < 20) newErrors.push("Fix #1 must be at least 20 characters");
    if (fix2.trim().length < 20) newErrors.push("Fix #2 must be at least 20 characters");
    if (fix3.trim().length < 20) newErrors.push("Fix #3 must be at least 20 characters");
    if (strongestElement.trim().length < 20)
      newErrors.push("Strongest element must be at least 20 characters");
    if (biggestRisk.trim().length < 20)
      newErrors.push("Biggest risk must be at least 20 characters");
    if (benchmark.trim().length < 20)
      newErrors.push("Competitive benchmark must be at least 20 characters");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !verdict || !qualityLevel) return;

    await onSubmit({
      releaseVerdict: verdict,
      releaseReadinessScore: readinessScore,
      topFixRank1: fix1,
      topFixRank1Impact: fix1Impact,
      topFixRank1TimeMin: fix1Time,
      topFixRank2: fix2,
      topFixRank2Impact: fix2Impact,
      topFixRank2TimeMin: fix2Time,
      topFixRank3: fix3,
      topFixRank3Impact: fix3Impact,
      topFixRank3TimeMin: fix3Time,
      strongestElement,
      biggestRisk,
      competitiveBenchmark: benchmark,
      qualityLevel: qualityLevel as any,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-purple-900 mb-1">Release Decision Review</h3>
              <p className="text-sm text-purple-700">
                This is a premium review. Please provide structured, actionable feedback to help
                the artist decide whether to release this track.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-2">Please fix these issues:</h4>
                <ul className="space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm text-red-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listen Time */}
      {!canSubmit && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-900">
              <strong>Listen to at least {Math.ceil(minListenTime / 60)} minutes</strong> before
              submitting. Current: {Math.floor(listenTime / 60)}m {listenTime % 60}s
            </p>
          </CardContent>
        </Card>
      )}

      {/* 1. Release Verdict */}
      <div ref={verdictRef}>
        <Label className="text-base font-bold mb-3 block">
          1. Release Verdict <span className="text-red-600">*</span>
        </Label>
        <p className="text-sm text-neutral-600 mb-3">
          Based on everything you heard, should the artist release this track?
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "RELEASE_NOW", label: "Release Now", color: "emerald" },
            { value: "FIX_FIRST", label: "Fix First", color: "amber" },
            { value: "NEEDS_WORK", label: "Needs Work", color: "red" },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setVerdict(value as any)}
              className={cn(
                "p-4 rounded-xl border-2 font-semibold transition-all",
                verdict === value
                  ? `border-${color}-600 bg-${color}-50 text-${color}-900`
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              )}
              style={{
                borderColor: verdict === value ? `rgb(${color === "emerald" ? "5 150 105" : color === "amber" ? "217 119 6" : "220 38 38"})` : undefined,
                backgroundColor: verdict === value ? `rgb(${color === "emerald" ? "236 253 245" : color === "amber" ? "254 243 199" : "254 226 226"})` : undefined,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Readiness Score */}
      <div>
        <Label className="text-base font-bold mb-3 block">
          2. Release Readiness Score <span className="text-red-600">*</span>
        </Label>
        <p className="text-sm text-neutral-600 mb-3">
          0 = Not ready at all, 100 = Completely release-ready
        </p>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-purple-600">{readinessScore}</div>
            <div className="text-sm text-neutral-500 mt-1">out of 100</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={readinessScore}
            onChange={(e) => setReadinessScore(parseInt(e.target.value))}
            className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${readinessScore}%, rgb(229 231 235) ${readinessScore}%, rgb(229 231 235) 100%)`,
            }}
          />
        </div>
      </div>

      {/* 3. Quality Level */}
      <div>
        <Label className="text-base font-bold mb-3 block">
          3. Quality Level <span className="text-red-600">*</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            "NOT_READY",
            "DEMO_STAGE",
            "ALMOST_THERE",
            "RELEASE_READY",
            "PROFESSIONAL",
          ].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setQualityLevel(level)}
              className={cn(
                "p-3 rounded-xl border-2 font-semibold text-sm transition-all",
                qualityLevel === level
                  ? "border-purple-600 bg-purple-50 text-purple-900"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              )}
            >
              {level.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Top 3 Fixes */}
      <div ref={fix1Ref} className="space-y-6">
        <div>
          <Label className="text-base font-bold mb-3 block">
            4. Top 3 Fixes (Ranked by Impact) <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-neutral-600 mb-4">
            List the 3 most important changes the artist should make, ranked by impact.
          </p>
        </div>

        {/* Fix #1 */}
        <Card className="border-2 border-red-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold text-red-900">Fix #1 (Highest Priority)</Label>
              <span className="text-xs text-neutral-500">{fix1.length} characters</span>
            </div>
            <textarea
              value={fix1}
              onChange={(e) => setFix1(e.target.value)}
              placeholder="Describe the most critical fix... (min 20 chars)"
              rows={3}
              className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-2 block">Impact Level</Label>
                <select
                  value={fix1Impact}
                  onChange={(e) => setFix1Impact(e.target.value as any)}
                  className="w-full rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="HIGH">High (Critical)</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Time to Fix (minutes)</Label>
                <input
                  type="number"
                  value={fix1Time}
                  onChange={(e) => setFix1Time(parseInt(e.target.value))}
                  min="1"
                  max="300"
                  className="w-full rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fix #2 */}
        <Card className="border-2 border-amber-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold text-amber-900">Fix #2</Label>
              <span className="text-xs text-neutral-500">{fix2.length} characters</span>
            </div>
            <textarea
              value={fix2}
              onChange={(e) => setFix2(e.target.value)}
              placeholder="Describe the second most important fix... (min 20 chars)"
              rows={3}
              className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-2 block">Impact Level</Label>
                <select
                  value={fix2Impact}
                  onChange={(e) => setFix2Impact(e.target.value as any)}
                  className="w-full rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="HIGH">High (Critical)</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Time to Fix (minutes)</Label>
                <input
                  type="number"
                  value={fix2Time}
                  onChange={(e) => setFix2Time(parseInt(e.target.value))}
                  min="1"
                  max="300"
                  className="w-full rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fix #3 */}
        <Card className="border-2 border-neutral-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold">Fix #3</Label>
              <span className="text-xs text-neutral-500">{fix3.length} characters</span>
            </div>
            <textarea
              value={fix3}
              onChange={(e) => setFix3(e.target.value)}
              placeholder="Describe the third fix... (min 20 chars)"
              rows={3}
              className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-2 block">Impact Level</Label>
                <select
                  value={fix3Impact}
                  onChange={(e) => setFix3Impact(e.target.value as any)}
                  className="w-full rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="HIGH">High (Critical)</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Time to Fix (minutes)</Label>
                <input
                  type="number"
                  value={fix3Time}
                  onChange={(e) => setFix3Time(parseInt(e.target.value))}
                  min="1"
                  max="300"
                  className="w-full rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Strongest Element */}
      <div ref={strongestRef}>
        <Label className="text-base font-bold mb-3 block">
          5. Strongest Element <span className="text-red-600">*</span>
        </Label>
        <p className="text-sm text-neutral-600 mb-3">
          What's working best in this track? What should the artist keep/emphasize?
        </p>
        <textarea
          value={strongestElement}
          onChange={(e) => setStrongestElement(e.target.value)}
          placeholder="Describe what's working really well... (min 20 chars)"
          rows={3}
          className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <div className="text-xs text-neutral-500 mt-1">{strongestElement.length} characters</div>
      </div>

      {/* 6. Biggest Risk */}
      <div ref={riskRef}>
        <Label className="text-base font-bold mb-3 block">
          6. Biggest Risk if Released Now <span className="text-red-600">*</span>
        </Label>
        <p className="text-sm text-neutral-600 mb-3">
          What's the main concern if they release this track as-is?
        </p>
        <textarea
          value={biggestRisk}
          onChange={(e) => setBiggestRisk(e.target.value)}
          placeholder="What could hurt the release if not fixed... (min 20 chars)"
          rows={3}
          className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <div className="text-xs text-neutral-500 mt-1">{biggestRisk.length} characters</div>
      </div>

      {/* 7. Competitive Benchmark */}
      <div>
        <Label className="text-base font-bold mb-3 block">
          7. Competitive Benchmark <span className="text-red-600">*</span>
        </Label>
        <p className="text-sm text-neutral-600 mb-3">
          Where does this track stand compared to similar releases? What's the expected placement?
        </p>
        <textarea
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value)}
          placeholder="e.g., 'Professional production quality, could compete with mid-tier Spotify releases in this genre...' (min 20 chars)"
          rows={3}
          className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <div className="text-xs text-neutral-500 mt-1">{benchmark.length} characters</div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full bg-purple-600 text-white hover:bg-purple-700 h-12 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Release Decision Review"}
        </Button>
        {!canSubmit && (
          <p className="text-sm text-amber-600 text-center mt-2">
            Listen for at least {Math.ceil(minListenTime / 60)} minutes to submit
          </p>
        )}
      </div>
    </div>
  );
}
