/**
 * Feedback Intelligence Engine — Text Quality Scoring
 *
 * Scores reviewer free-text feedback on specificity, actionability,
 * and technical depth using vocabulary and pattern matching.
 */

// ── Types ───────────────────────────────────────────────────────

export interface TextQualityScore {
  specificity: number;      // 0-1: References specific elements, timestamps, frequencies
  actionability: number;    // 0-1: Contains concrete suggestions
  technicalDepth: number;   // 0-1: Uses production terminology
  overall: number;          // weighted composite
}

export interface ReviewTextQualityResult {
  fields: Record<string, TextQualityScore>;
  compositeSpecificity: number;
  compositeActionability: number;
  compositeTechnicalDepth: number;
  compositeOverall: number;
}

// ── Vocabulary & Patterns ───────────────────────────────────────

const TIMESTAMP_PATTERN = /\b\d{1,2}:\d{2}\b/g;
const FREQUENCY_PATTERN = /\b\d+\s*(hz|khz)\b/gi;
const DB_PATTERN = /\b-?\d+\s*d[bB]\b/g;

const ELEMENT_REFS = new Set([
  "kick", "snare", "hi-hat", "hihat", "hat", "bass", "sub", "808",
  "vocal", "vocals", "lead", "synth", "pad", "guitar", "piano",
  "keys", "strings", "drums", "percussion", "clap", "ride", "cymbal",
  "tom", "shaker", "tambourine", "bell", "pluck", "arp", "chord",
  "melody", "harmony", "hook", "riff", "sample", "loop", "fx",
  "reverb", "delay", "chorus effect", "flanger", "phaser",
  "distortion", "saturation", "compression", "limiter", "eq",
  "filter", "sidechain", "automation", "panning",
]);

const SECTION_REFS = new Set([
  "intro", "verse", "chorus", "pre-chorus", "prechorus", "bridge",
  "breakdown", "buildup", "build-up", "drop", "outro", "hook",
  "interlude", "transition", "middle 8", "middle eight",
]);

const PRODUCTION_TERMS = new Set([
  "mix", "master", "mastering", "headroom", "clipping", "distortion",
  "saturation", "sidechain", "compression", "limiter", "eq",
  "equalization", "low-pass", "high-pass", "bandpass", "notch",
  "resonance", "cutoff", "frequency", "spectrum", "spectral",
  "stereo", "mono", "mid-side", "panning", "width", "depth",
  "reverb", "delay", "echo", "spatial", "imaging", "soundstage",
  "transient", "attack", "release", "sustain", "decay", "envelope",
  "adsr", "dynamics", "loudness", "lufs", "rms", "peak",
  "gain staging", "gain", "level", "volume", "automation",
  "arrangement", "structure", "tempo", "bpm", "groove", "swing",
  "quantize", "humanize", "timing", "pitch", "tuning", "key",
  "scale", "chord progression", "harmonic", "melodic", "rhythmic",
  "timbre", "tone", "texture", "warmth", "brightness", "muddy",
  "harsh", "crisp", "clean", "punchy", "boomy", "thin", "full",
  "rich", "airy", "dark", "bright", "presence", "clarity",
  "separation", "definition", "cohesion", "balance", "polish",
  "professional", "radio-ready", "release-ready", "commercial",
  "low end", "low-end", "mids", "mid-range", "midrange",
  "high end", "high-end", "highs", "lows", "sub-bass", "subbass",
  "top end", "top-end", "frequency range", "frequency spectrum",
  "noise floor", "signal-to-noise", "phase", "phase cancellation",
  "mono compatibility", "reference track", "a/b", "parallel",
  "bus", "send", "return", "insert", "plugin", "vst", "daw",
]);

const SUGGESTION_PATTERNS = [
  /\b(try|consider|experiment with|you could|you might|i['']d suggest|i recommend|maybe)\b/gi,
  /\b(instead of|rather than|swap|replace|add|remove|reduce|increase|boost|cut)\b/gi,
  /\b(would benefit from|could use|needs more|needs less|too much|not enough)\b/gi,
];

const CAUSAL_PATTERNS = [
  /\b(because|since|which causes|which makes|the result is|leading to|due to)\b/gi,
  /\b(so that|in order to|this creates|this gives|this adds)\b/gi,
];

const COMPARISON_PATTERNS = [
  /\b(compared to|similar to|reminds me of|like .+'s|in the style of)\b/gi,
  /\b(currently .+ but could|right now .+ but|instead of .+ try)\b/gi,
];

const GENERIC_PHRASES = [
  /\bsounds? good\b/gi,
  /\bnice (beat|track|song|music|work)\b/gi,
  /\bkeep it up\b/gi,
  /\bgood job\b/gi,
  /\bi like(d)? it\b/gi,
  /\bpretty (good|nice|cool|dope)\b/gi,
  /\bno complaints?\b/gi,
  /\bnothing (wrong|bad|to complain)\b/gi,
  /\boverall (good|great|nice)\b/gi,
];

// ── Scoring Functions ───────────────────────────────────────────

function scoreSpecificity(text: string): number {
  if (!text || text.trim().length < 5) return 0;

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let score = 0;
  let maxScore = 0;

  // Timestamp references (strong signal)
  maxScore += 0.25;
  const timestamps = text.match(TIMESTAMP_PATTERN) || [];
  if (timestamps.length >= 2) score += 0.25;
  else if (timestamps.length === 1) score += 0.15;

  // Frequency / dB references
  maxScore += 0.15;
  const freqRefs = (text.match(FREQUENCY_PATTERN) || []).length + (text.match(DB_PATTERN) || []).length;
  if (freqRefs > 0) score += 0.15;

  // Element references (kick, snare, vocal, etc.)
  maxScore += 0.25;
  const elementHits = words.filter((w) => ELEMENT_REFS.has(w.replace(/[^a-z-]/g, ""))).length;
  if (elementHits >= 3) score += 0.25;
  else if (elementHits >= 2) score += 0.18;
  else if (elementHits >= 1) score += 0.1;

  // Section references (verse, chorus, bridge, etc.)
  maxScore += 0.2;
  const sectionHits = words.filter((w) => SECTION_REFS.has(w.replace(/[^a-z-]/g, ""))).length;
  // Also check multi-word section refs
  const multiWordSections = ["pre-chorus", "middle 8", "middle eight", "build-up"].filter(
    (s) => lower.includes(s)
  ).length;
  const totalSections = sectionHits + multiWordSections;
  if (totalSections >= 2) score += 0.2;
  else if (totalSections >= 1) score += 0.12;

  // Word count bonus (longer = more likely specific)
  maxScore += 0.15;
  if (words.length >= 40) score += 0.15;
  else if (words.length >= 25) score += 0.1;
  else if (words.length >= 15) score += 0.05;

  return maxScore > 0 ? Math.min(1, score / maxScore) : 0;
}

function scoreActionability(text: string): number {
  if (!text || text.trim().length < 5) return 0;

  let score = 0;
  let maxScore = 0;

  // Suggestion patterns
  maxScore += 0.35;
  let suggestionHits = 0;
  for (const pattern of SUGGESTION_PATTERNS) {
    const matches = text.match(pattern) || [];
    suggestionHits += matches.length;
  }
  if (suggestionHits >= 3) score += 0.35;
  else if (suggestionHits >= 2) score += 0.25;
  else if (suggestionHits >= 1) score += 0.15;

  // Causal reasoning
  maxScore += 0.25;
  let causalHits = 0;
  for (const pattern of CAUSAL_PATTERNS) {
    causalHits += (text.match(pattern) || []).length;
  }
  if (causalHits >= 2) score += 0.25;
  else if (causalHits >= 1) score += 0.15;

  // Comparison patterns
  maxScore += 0.2;
  let comparisonHits = 0;
  for (const pattern of COMPARISON_PATTERNS) {
    comparisonHits += (text.match(pattern) || []).length;
  }
  if (comparisonHits >= 1) score += 0.2;

  // Anti-quality: generic praise penalty
  maxScore += 0.2;
  let genericHits = 0;
  for (const pattern of GENERIC_PHRASES) {
    genericHits += (text.match(pattern) || []).length;
  }
  if (genericHits === 0) score += 0.2;
  else if (genericHits === 1) score += 0.1;
  // 2+ generic phrases = no bonus

  return maxScore > 0 ? Math.min(1, score / maxScore) : 0;
}

function scoreTechnicalDepth(text: string): number {
  if (!text || text.trim().length < 5) return 0;

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let score = 0;
  let maxScore = 0;

  // Production terminology
  maxScore += 0.5;
  const termHits = words.filter((w) => PRODUCTION_TERMS.has(w.replace(/[^a-z-/]/g, ""))).length;
  // Also check multi-word terms
  const multiWordTerms = [
    "low end", "high end", "mid range", "gain staging", "chord progression",
    "frequency range", "frequency spectrum", "noise floor", "phase cancellation",
    "mono compatibility", "reference track", "signal-to-noise",
  ].filter((t) => lower.includes(t)).length;
  const totalTerms = termHits + multiWordTerms;

  if (totalTerms >= 6) score += 0.5;
  else if (totalTerms >= 4) score += 0.35;
  else if (totalTerms >= 2) score += 0.2;
  else if (totalTerms >= 1) score += 0.1;

  // Multi-dimensional observation (mentions 2+ different aspects)
  maxScore += 0.3;
  const aspects = new Set<string>();
  const aspectCategories: Record<string, string[]> = {
    spectral: ["eq", "frequency", "bass", "treble", "mids", "low end", "high end", "bright", "dark", "muddy", "harsh"],
    dynamics: ["compression", "limiter", "loudness", "dynamics", "transient", "punch", "squash"],
    spatial: ["stereo", "panning", "width", "reverb", "delay", "spatial", "depth", "imaging"],
    arrangement: ["arrangement", "structure", "verse", "chorus", "bridge", "intro", "outro", "section"],
    timbral: ["timbre", "tone", "texture", "warmth", "character", "sound design"],
  };
  for (const [category, keywords] of Object.entries(aspectCategories)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      aspects.add(category);
    }
  }
  if (aspects.size >= 3) score += 0.3;
  else if (aspects.size >= 2) score += 0.2;
  else if (aspects.size >= 1) score += 0.1;

  // Frequency / dB references (highly technical)
  maxScore += 0.2;
  const techRefs = (text.match(FREQUENCY_PATTERN) || []).length + (text.match(DB_PATTERN) || []).length;
  if (techRefs >= 2) score += 0.2;
  else if (techRefs >= 1) score += 0.12;

  return maxScore > 0 ? Math.min(1, score / maxScore) : 0;
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Score a single text field.
 */
export function scoreTextQuality(text: string): TextQualityScore {
  const specificity = scoreSpecificity(text);
  const actionability = scoreActionability(text);
  const technicalDepth = scoreTechnicalDepth(text);

  // Weighted composite: specificity 0.35, actionability 0.40, technicalDepth 0.25
  const overall = specificity * 0.35 + actionability * 0.40 + technicalDepth * 0.25;

  return { specificity, actionability, technicalDepth, overall };
}

/**
 * Score all text fields in a review and produce a composite result.
 */
export function scoreReviewTextQuality(fields: Record<string, string | null | undefined>): ReviewTextQualityResult {
  const scored: Record<string, TextQualityScore> = {};
  const allScores: TextQualityScore[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value && value.trim().length > 0) {
      const score = scoreTextQuality(value);
      scored[key] = score;
      allScores.push(score);
    }
  }

  if (allScores.length === 0) {
    return {
      fields: scored,
      compositeSpecificity: 0,
      compositeActionability: 0,
      compositeTechnicalDepth: 0,
      compositeOverall: 0,
    };
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    fields: scored,
    compositeSpecificity: avg(allScores.map((s) => s.specificity)),
    compositeActionability: avg(allScores.map((s) => s.actionability)),
    compositeTechnicalDepth: avg(allScores.map((s) => s.technicalDepth)),
    compositeOverall: avg(allScores.map((s) => s.overall)),
  };
}
