/**
 * Review form configuration based on artist experience level and feedback focus areas.
 * 
 * Determines which sections to show, placeholder text, word minimums,
 * and the context banner content shown to the reviewer.
 */

type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
type FeedbackArea = "OVERALL_VIBE" | "MIXING" | "ARRANGEMENT" | "SONGWRITING" | "SOUND_DESIGN" | "RELEASE_READINESS";

// ── Experience Level Metadata ───────────────────────────────────────

const EXPERIENCE_META: Record<ExperienceLevel, {
  label: string;
  tagColor: string;
  guidanceShort: string;
  guidanceFull: string;
}> = {
  BEGINNER: {
    label: "Just Starting Out",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    guidanceShort: "Use plain language — avoid jargon.",
    guidanceFull: "This artist is new to production. Use plain language, focus on what works vs what doesn't. Encouragement with direction is most helpful — skip the deep technical stuff.",
  },
  INTERMEDIATE: {
    label: "Getting Serious",
    tagColor: "bg-blue-100 text-blue-800 border-blue-200",
    guidanceShort: "Be constructive — explain the why.",
    guidanceFull: "This artist knows the fundamentals and wants to level up. Be constructive, explain why something works or doesn't. Light technical language is fine.",
  },
  ADVANCED: {
    label: "Experienced Producer",
    tagColor: "bg-purple-100 text-purple-800 border-purple-200",
    guidanceShort: "Get technical — they can handle it.",
    guidanceFull: "Experienced producer who wants detailed feedback. Get technical — mention specific frequencies, processing techniques, arrangement choices. Be direct.",
  },
  PROFESSIONAL: {
    label: "Professional",
    tagColor: "bg-amber-100 text-amber-800 border-amber-200",
    guidanceShort: "Full depth — hold nothing back.",
    guidanceFull: "Professional artist who releases commercially. Go full depth — compare to commercial references, be brutally honest about release readiness. They want the truth.",
  },
};

// ── Feedback Area Metadata ──────────────────────────────────────────

const AREA_META: Record<FeedbackArea, {
  label: string;
  emoji: string;
}> = {
  OVERALL_VIBE: { label: "Overall Vibe", emoji: "🎵" },
  MIXING: { label: "Mixing & Sound", emoji: "🎚️" },
  ARRANGEMENT: { label: "Arrangement", emoji: "🎼" },
  SONGWRITING: { label: "Songwriting", emoji: "✍️" },
  SOUND_DESIGN: { label: "Sound Design", emoji: "🎛️" },
  RELEASE_READINESS: { label: "Release Readiness", emoji: "🚀" },
};

// ── Technical Issue Labels Per Level ────────────────────────────────

const TECHNICAL_ISSUES_DEFAULT = [
  { id: "vocals-buried", label: "Vocals buried" },
  { id: "muddy-low", label: "Muddy low end" },
  { id: "compressed", label: "Over-compressed" },
  { id: "harsh-highs", label: "Harsh highs" },
  { id: "narrow-stereo", label: "Narrow stereo" },
  { id: "repetitive", label: "Too repetitive" },
  { id: "too-long", label: "Too long" },
];

const TECHNICAL_ISSUES_BEGINNER = [
  { id: "vocals-buried", label: "Can't hear the vocals" },
  { id: "muddy-low", label: "Bass too loud" },
  { id: "compressed", label: "Sounds squashed" },
  { id: "harsh-highs", label: "Highs are painful" },
  { id: "repetitive", label: "Gets repetitive" },
  { id: "too-long", label: "Too long" },
];

const TECHNICAL_ISSUES_ADVANCED = [
  { id: "vocals-buried", label: "Vocals buried" },
  { id: "muddy-low", label: "Muddy low end" },
  { id: "compressed", label: "Over-compressed" },
  { id: "harsh-highs", label: "Harsh highs" },
  { id: "narrow-stereo", label: "Narrow stereo" },
  { id: "phase-issues", label: "Phase issues" },
  { id: "mono-compat", label: "Poor mono compat" },
  { id: "repetitive", label: "Too repetitive" },
  { id: "too-long", label: "Too long" },
];

// ── Main Config Function ────────────────────────────────────────────

export interface ReviewFormConfig {
  // Section visibility
  showTechnicalIssues: boolean;
  showQualityLevel: boolean;
  showNextFocus: boolean;
  showPlaylistAction: boolean;

  // Always shown (core)
  showFirstImpression: true;
  showWouldListenAgain: true;
  showBestMoment: true;
  showMainFeedback: true;

  // Text prompts
  mainFeedbackLabel: string;
  mainFeedbackPrompt: string;
  bestMomentLabel: string;
  bestMomentPrompt: string;

  // Word minimums
  mainFeedbackMinWords: number;
  bestMomentMinWords: number;

  // Technical issues
  technicalIssueOptions: { id: string; label: string }[];

  // Context banner
  experienceLabel: string;
  experienceTagColor: string;
  areaLabels: string[];
  guidanceText: string;
  hasContext: boolean;
}

export function getReviewFormConfig(
  experienceLevel: string | null | undefined,
  feedbackAreas: string[] | null | undefined,
  feedbackFocus: string | null | undefined,
): ReviewFormConfig {
  const level = (experienceLevel as ExperienceLevel) ?? "INTERMEDIATE";
  const areas = ((feedbackAreas ?? []) as FeedbackArea[]);

  const hasMixing = areas.includes("MIXING");
  const hasArrangement = areas.includes("ARRANGEMENT");
  const hasSongwriting = areas.includes("SONGWRITING");
  const hasSoundDesign = areas.includes("SOUND_DESIGN");
  const hasReleaseReadiness = areas.includes("RELEASE_READINESS");
  const hasOverallVibe = areas.includes("OVERALL_VIBE");
  const hasAnyArea = areas.length > 0;

  // If no areas selected, show everything (backwards compat for old tracks)
  const showAll = !hasAnyArea;

  const expMeta = EXPERIENCE_META[level] ?? EXPERIENCE_META.INTERMEDIATE;

  return {
    // Section visibility
    showTechnicalIssues: showAll || hasMixing || hasSoundDesign || hasReleaseReadiness,
    showQualityLevel: showAll || hasMixing || hasReleaseReadiness || hasSoundDesign,
    showNextFocus: showAll || hasArrangement || hasReleaseReadiness || hasMixing,
    showPlaylistAction: showAll || hasOverallVibe || hasReleaseReadiness || hasSongwriting,

    // Always shown
    showFirstImpression: true,
    showWouldListenAgain: true,
    showBestMoment: true,
    showMainFeedback: true,

    // Prompts adapted by focus areas + level
    mainFeedbackLabel: getMainFeedbackLabel(areas),
    mainFeedbackPrompt: getMainPrompt(level, areas),
    bestMomentLabel: getBestMomentLabel(areas),
    bestMomentPrompt: getBestMomentPrompt(level, areas),

    // Word minimums by level
    mainFeedbackMinWords: level === "BEGINNER" ? 15 : level === "PROFESSIONAL" ? 25 : 20,
    bestMomentMinWords: level === "BEGINNER" ? 10 : 15,

    // Technical issues adapted by level
    technicalIssueOptions: getTechnicalIssues(level),

    // Context banner
    experienceLabel: expMeta.label,
    experienceTagColor: expMeta.tagColor,
    areaLabels: areas.map(a => AREA_META[a]?.label ?? a),
    guidanceText: expMeta.guidanceFull,
    hasContext: !!experienceLevel || hasAnyArea || !!feedbackFocus,
  };
}

// ── Prompt Generators ───────────────────────────────────────────────

function getMainFeedbackLabel(areas: FeedbackArea[]): string {
  if (areas.length === 0) return "Main Feedback *";
  if (areas.length === 1) {
    const labels: Record<FeedbackArea, string> = {
      OVERALL_VIBE: "What didn't land? *",
      MIXING: "Mix Feedback *",
      ARRANGEMENT: "Arrangement Feedback *",
      SONGWRITING: "Songwriting Feedback *",
      SOUND_DESIGN: "Sound Design Feedback *",
      RELEASE_READINESS: "What needs fixing before release? *",
    };
    return labels[areas[0]] ?? "Main Feedback *";
  }
  return "Main Feedback *";
}

function getBestMomentLabel(areas: FeedbackArea[]): string {
  if (areas.length === 1) {
    const labels: Record<FeedbackArea, string> = {
      OVERALL_VIBE: "Best Part *",
      MIXING: "What sounds great? *",
      ARRANGEMENT: "Strongest section? *",
      SONGWRITING: "Most memorable moment? *",
      SOUND_DESIGN: "Best sound/texture? *",
      RELEASE_READINESS: "Strongest element? *",
    };
    return labels[areas[0]] ?? "Best Moment *";
  }
  return "Best Moment *";
}

function getMainPrompt(level: ExperienceLevel, areas: FeedbackArea[]): string {
  // Level-specific base
  const levelPrefix: Record<ExperienceLevel, string> = {
    BEGINNER: "What didn't work for you? What would make it better? Keep it simple — no need for technical terms.",
    INTERMEDIATE: "What's holding the track back, and what would you change? Be specific where you can.",
    ADVANCED: "What needs work? Mention specific elements, timestamps, frequencies, or processing if relevant.",
    PROFESSIONAL: "What's the gap between this and a commercial release? Be direct — reference tracks, specific technical issues, competitive positioning.",
  };

  // Area-specific examples
  if (areas.includes("MIXING") && !areas.includes("OVERALL_VIBE")) {
    const examples: Record<ExperienceLevel, string> = {
      BEGINNER: "E.g., 'The drums are too quiet compared to the synths' or 'It sounds muffled'",
      INTERMEDIATE: "E.g., 'The low end feels heavy — the kick and bass are fighting for space'",
      ADVANCED: "E.g., 'The low-mids around 200-300Hz are building up. Try a surgical cut on the pads to let the bass breathe.'",
      PROFESSIONAL: "E.g., 'Sub-bass is masking the kick transient. The vocal needs 2-3dB more presence around 3kHz. Stereo image collapses in mono below 200Hz.'",
    };
    return examples[level];
  }

  if (areas.includes("ARRANGEMENT") && !areas.includes("OVERALL_VIBE")) {
    return level === "BEGINNER"
      ? "E.g., 'The song feels like it goes on too long without changing' or 'I wanted a bigger moment but it never came'"
      : "E.g., 'The verse-chorus transition needs more contrast. The drop at 1:30 could use a longer buildup to create anticipation.'";
  }

  if (areas.includes("SONGWRITING") && !areas.includes("OVERALL_VIBE")) {
    return level === "BEGINNER"
      ? "E.g., 'The melody didn't stick with me' or 'The hook at the chorus is catchy but the verse melody is flat'"
      : "E.g., 'The chord progression in the verse is predictable — try a borrowed chord or key change going into the chorus.'";
  }

  if (areas.includes("OVERALL_VIBE")) {
    return level === "BEGINNER"
      ? "E.g., 'It felt slow in the middle' or 'The energy drops after the intro and doesn't come back'"
      : "E.g., 'The vibe is right but the energy dips around 1:40. The intro pulls you in but the middle section loses momentum.'";
  }

  return levelPrefix[level];
}

function getBestMomentPrompt(level: ExperienceLevel, areas: FeedbackArea[]): string {
  if (areas.includes("MIXING")) {
    return level === "BEGINNER"
      ? "E.g., 'The drums sound punchy and clear' or 'The vocal sits perfectly in the mix'"
      : "E.g., 'The kick-bass relationship is tight — great sidechain work. The vocal reverb choices create a nice sense of depth.'";
  }

  if (areas.includes("SONGWRITING")) {
    return level === "BEGINNER"
      ? "E.g., 'The chorus melody is catchy — I was humming it after' or 'The lyrics in the second verse hit hard'"
      : "E.g., 'The pre-chorus melody creates great tension that resolves perfectly into the hook. The lyrical imagery in verse 2 is vivid.'";
  }

  return level === "BEGINNER"
    ? "E.g., 'The drop at 1:00 was fire' or 'The vocal harmonies in the chorus are beautiful'"
    : "E.g., 'The atmospheric pad at 0:35 creates this space that makes you want to float in it. The vocal processing in the bridge is haunting.'";
}

function getTechnicalIssues(level: ExperienceLevel): { id: string; label: string }[] {
  if (level === "BEGINNER") return TECHNICAL_ISSUES_BEGINNER;
  if (level === "ADVANCED" || level === "PROFESSIONAL") return TECHNICAL_ISSUES_ADVANCED;
  return TECHNICAL_ISSUES_DEFAULT;
}
