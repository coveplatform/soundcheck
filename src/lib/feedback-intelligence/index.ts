export {
  computeBehavioralAlignment,
  aggregateBehavioralInsights,
  type AlignmentResult,
  type AlignmentSignal,
  type ExplicitFeedback,
  type AggregatedInsights,
  type RawBehaviorEvent,
  type BehaviorMetrics,
} from "./behavior-analysis";

export {
  scoreTextQuality,
  scoreReviewTextQuality,
  type TextQualityScore,
  type ReviewTextQualityResult,
} from "./text-quality";

export {
  classifyListenerArchetype,
  computeCredibilityScore,
  detectEngagementAnomalies,
  computeBehavioralFingerprint,
  type ListenerArchetype,
  type ArchetypeResult,
  type CredibilityResult,
  type EngagementAnomaly,
  type AnomalyType,
  type BehavioralFingerprint,
  type FingerprintDimension,
} from "./advanced-analysis";
