# MixReflect Feedback Intelligence Engine (FIE)

> **Vision**: The most advanced music feedback technology ever built — a living, adaptive system that captures what reviewers *do*, not just what they *say*, synthesizes multi-reviewer consensus with confidence weighting, and tracks artist growth over time.

---

## Design Philosophy: The Nightclub Vibe Check

**The core insight**: The research and engine complexity lives *behind the scenes*. The reviewer experience should feel like reacting to music at a nightclub — visceral, low-friction, almost fun — not filling out an academic survey.

> "Imagine playing your music to a packed nightclub where everyone gives you a vibe check."

### Principles

1. **Reviewers react, the engine analyzes.** Quick emoji-style first impressions, short free-text reactions, one-tap choices. The behavioral layer passively captures the deep data (seek patterns, replays, attention) without the reviewer doing anything extra.

2. **Less asking, more observing.** The 8 perceptual dimensions and sub-scales are *derived intelligence*, not reviewer-facing form fields. Instead of asking "Rate spectral balance 1-7", we observe that 3 listeners replayed the chorus and 2 skipped the bridge — and we *compute* spectral balance insights from behavioral consensus + targeted micro-questions.

3. **Interactive > Interrogative.** Instead of a long form, the review experience is *interactive*. Behavioral-driven questions ("You replayed 1:30 — what caught your ear?") feel conversational, not clinical. The form adapts in real-time based on what the listener actually did.

4. **The magic is in the synthesis.** Individual reviews are just vibe checks. The engine's job is to synthesize 5-10 casual reactions into a rigorous, research-backed feedback report with confidence intervals, action priorities, and behavioral evidence. Artists get *intelligence*, reviewers give *reactions*.

5. **Lower friction = more honest data.** Academic-style forms trigger performative responses. Quick, intuitive reactions are harder to fake and more emotionally honest — especially when cross-referenced against behavioral signals.

### What This Means for Implementation

- **Reviewer form**: Stays lightweight (first impression → would-listen-again → best moment → main feedback → quality gut check). The research informs *what we ask* and *how we score it*, not form complexity.
- **Behavioral layer**: Does the heavy lifting invisibly. Every play, pause, seek, volume change, and tab switch is captured and analyzed.
- **Text quality scoring**: Runs server-side after submission. Reviewers never see their "specificity score" — but high-quality reviewers get surfaced more prominently.
- **Artist-facing output**: Where the full research power shows up. Engagement curves, hottest moments, drop-off points, behavioral-explicit alignment, consensus synthesis — all derived from casual reviewer reactions.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Research Foundations](#research-foundations)
3. [Architecture Overview](#architecture-overview)
4. [Pillar 1: Behavioral Listening Intelligence](#pillar-1-behavioral-listening-intelligence)
5. [Pillar 2: Perceptual Dimension Framework](#pillar-2-perceptual-dimension-framework)
6. [Pillar 3: Adaptive Review Engine](#pillar-3-adaptive-review-engine)
7. [Pillar 4: Reviewer Calibration System](#pillar-4-reviewer-calibration-system)
8. [Pillar 5: Consensus Synthesis Engine](#pillar-5-consensus-synthesis-engine)
9. [Pillar 6: Artist Growth Intelligence](#pillar-6-artist-growth-intelligence)
10. [Pillar 7: Feedback Quality Scoring](#pillar-7-feedback-quality-scoring)
11. [Patent Claims](#patent-claims)
12. [Data Models](#data-models)
13. [Implementation Phases](#implementation-phases)

---

## Current State Analysis

### What Exists Today

The current review system is a **static form** with:
- 180-second minimum listen timer (heartbeat-tracked)
- 3-value first impression (Strong Hook / Decent / Lost Interest)
- 7 binary technical issue checkboxes
- 2 free-text fields (Best Moment 15+ words, Main Feedback 20+ words)
- 4-option playlist action
- 5-level quality assessment
- 6-option next focus area
- Manual timestamp notes
- Basic text validation (word count, uniqueness ratio, keyword detection)

### Critical Gaps

| Gap | Impact |
|-----|--------|
| No behavioral data capture | Can't validate explicit feedback against actual listening behavior |
| Static form for all genres | Hip-hop gets same form as ambient electronic |
| No reviewer calibration | A "4/5" means different things to different people |
| No cross-review synthesis | Artist sees individual reviews, not synthesized intelligence |
| No confidence weighting | Novice and expert opinions weighted equally |
| No longitudinal tracking | Can't show artists how they're improving |
| No psychoacoustic grounding | Categories don't map to established perception science |
| No adaptive questioning | Doesn't drill deeper when issues are detected |

---

## Research Foundations

This engine is grounded in peer-reviewed research and industry best practices:

### Music Perception & Psychoacoustics
- **Bregman (1990)** — *Auditory Scene Analysis*: How humans parse complex audio into streams. Informs our perceptual dimension decomposition.
- **McAdams et al. (1995)** — *Perceptual scaling of synthesized timbres*: Identified core perceptual dimensions of timbre (spectral centroid, attack time, spectral flux). Basis for our spectral assessment axes.
- **Alluri et al. (2012)** — *Large-scale brain correlates of musical features*: fMRI mapping of how musical features activate brain regions. Informs engagement prediction.
- **Juslin & Västfjäll (2008)** — *Emotional responses to music*: The BRECVEMA framework (Brain stem reflexes, Rhythmic entrainment, Evaluative conditioning, Contagion, Visual imagery, Episodic memory, Musical expectancy, Aesthetic judgment). Informs our emotional resonance dimension.

### Audio Quality Assessment Standards
- **ITU-R BS.1534 (MUSHRA)** — Multi-Stimulus with Hidden Reference and Anchor. Gold standard for perceptual audio quality evaluation. Informs our calibration track methodology.
- **AES Convention Papers (De Man et al., 2014)** — *An analysis and evaluation of audio features for multitrack music mixtures*: Framework for perceptual evaluation of music mixing. Directly informs our spectral balance and spatial dimensions.
- **Pestana et al. (2013)** — *Automatic mixing systems using adaptive digital audio effects*: Quantifies the dimensions that distinguish professional from amateur mixes.
- **Wilson & Fazenda (2016)** — *Perception of audio quality in productions of popular music*: Identified 9 perceptual dimensions of mix quality. Core reference for our dimension taxonomy.

### Feedback Science
- **Hattie & Timperley (2007)** — *The Power of Feedback*: Effective feedback answers three questions: Where am I going? How am I going? Where to next? Our framework enforces all three.
- **Shute (2008)** — *Focus on Formative Feedback*: Actionability > judgment. Specific > vague. Timely > delayed. Informs our text quality scoring.
- **Kluger & DeNisi (1996)** — *Effects of feedback interventions*: Meta-analysis showing feedback is harmful in 1/3 of cases when poorly structured. Informs our quality gates.
- **Dweck (2006)** — *Mindset*: Growth-oriented framing produces better outcomes than fixed-judgment framing. Informs our language and scoring presentation.

### Multi-Rater Consensus & Calibration
- **Prelec (2004)** — *Bayesian Truth Serum*: Method for eliciting honest opinions by rewarding answers that are "surprisingly common." Informs consensus weighting.
- **Krippendorff (2011)** — *Computing Krippendorff's Alpha-Reliability*: Standard inter-rater reliability metric. Used for reviewer calibration scoring.
- **Surowiecki (2004)** — *The Wisdom of Crowds*: Conditions under which crowd aggregation outperforms individual experts. Informs our minimum review thresholds and independence enforcement.

### Behavioral Analytics
- **Spotify Research** — Audio feature extraction and engagement prediction models. Informs behavioral signal design.
- **Netflix Research** — Skip rate, completion rate, and re-engagement as engagement proxies. Directly informs our behavioral listening intelligence.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEEDBACK INTELLIGENCE ENGINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  BEHAVIORAL   │  │   ADAPTIVE   │  │     REVIEWER         │  │
│  │  LISTENING    │  │   REVIEW     │  │     CALIBRATION      │  │
│  │  INTELLIGENCE │  │   ENGINE     │  │     SYSTEM           │  │
│  │              │  │              │  │                      │  │
│  │  Seek events  │  │  Genre-aware │  │  Bias profiling      │  │
│  │  Replay zones │  │  Conditional │  │  Expertise mapping   │  │
│  │  Pause points │  │  Deep-dives  │  │  Consistency scoring │  │
│  │  Attention    │  │  Consensus-  │  │  Calibration tracks  │  │
│  │  curve        │  │  seeking Qs  │  │  Hidden references   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                      │              │
│         ▼                  ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PERCEPTUAL DIMENSION FRAMEWORK              │    │
│  │                                                          │    │
│  │  Spectral Balance │ Spatial │ Dynamic │ Timbral │        │    │
│  │  Structural │ Emotional │ Technical │ Market Readiness   │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │  CONSENSUS    │  │   FEEDBACK   │  │  ARTIST GROWTH   │      │
│  │  SYNTHESIS    │  │   QUALITY    │  │  INTELLIGENCE    │      │
│  │  ENGINE       │  │   SCORING    │  │                  │      │
│  │               │  │              │  │  Dimension       │      │
│  │  Agreement    │  │  Specificity │  │  history         │      │
│  │  detection    │  │  Actionab-   │  │  Improvement     │      │
│  │  Contradiction│  │  ility       │  │  velocity        │      │
│  │  flagging     │  │  Technical   │  │  Persistent      │      │
│  │  Confidence-  │  │  depth       │  │  weaknesses      │      │
│  │  weighted     │  │  Behavioral  │  │  Growth roadmap   │      │
│  │  aggregation  │  │  validation  │  │                  │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pillar 1: Behavioral Listening Intelligence

### Concept

Instead of just tracking "did they listen 180 seconds?", capture **rich behavioral signals** that reveal what the reviewer *actually experienced* while listening. This creates a "behavioral truth layer" that validates explicit feedback.

### Data Captured

```typescript
interface ListenBehaviorEvent {
  type: 'PLAY' | 'PAUSE' | 'SEEK' | 'VOLUME' | 'REPLAY_DETECT' | 'TAB_FOCUS' | 'TAB_BLUR';
  timestamp: number;     // wall-clock time
  trackPosition: number; // seconds into the track
  metadata?: {
    seekFrom?: number;   // for SEEK events
    seekTo?: number;
    volumeLevel?: number; // 0-1 for VOLUME events
    replayStart?: number; // for REPLAY_DETECT
    replayEnd?: number;
  };
}
```

### Derived Metrics (Computed Server-Side)

| Metric | Formula | Meaning |
|--------|---------|---------|
| **Completion Rate** | furthest_position / track_duration | Did they listen to the whole thing? |
| **Attention Score** | active_listen_time / total_session_time | Were they focused or multitasking? |
| **Engagement Curve** | Array of per-10s engagement scores | Where did they zone in/out? |
| **Replay Zones** | Sections listened to >1.5× | What captured their attention? |
| **Skip Zones** | Sections seeked past | What lost their interest? |
| **First Skip Timestamp** | First forward seek event | When did engagement first drop? |
| **Volume Peaks** | Points where volume was increased | Sections they wanted to hear louder |
| **Pause-to-Think Points** | Pause events >3s mid-track | Moments that made them stop and process |
| **Behavioral-Explicit Alignment** | Correlation score | Does what they said match what they did? |

### Implementation

The audio player already has `onTimeUpdate` and `onListenProgress` callbacks. We enhance it to also capture:

1. **Seek detection**: Track `currentTime` jumps > 2 seconds
2. **Replay detection**: Track when `currentTime` enters a previously-listened zone
3. **Pause/Play events**: Already available from the HTML5 audio API
4. **Tab visibility**: `document.visibilityState` changes
5. **Volume changes**: Already available from audio element

Events are buffered client-side and sent in batches with heartbeats (every 5 seconds during playback). This adds minimal overhead.

### Behavioral-Explicit Alignment Score

This is the **key innovation**. For each review, compute how well the reviewer's behavior matches their explicit feedback:

- Reviewer said "Strong Hook" but seeked forward in the first 30 seconds → **low alignment**
- Reviewer said "Best part is the chorus" and replay data shows they replayed the chorus → **high alignment**
- Reviewer said "too repetitive" but listened to the whole track without seeking → **moderate alignment** (maybe they pushed through)

This score is used to:
1. **Weight reviews** in consensus calculations (high-alignment reviews count more)
2. **Flag suspicious reviews** for admin attention (very low alignment)
3. **Provide additional context** to artists ("3 reviewers replayed your chorus — that's a strong hook signal")

---

## Pillar 2: Perceptual Dimension Framework

### The 8 Dimensions

Based on Wilson & Fazenda (2016), McAdams et al. (1995), and AES standards, we decompose music quality into 8 perceptual dimensions. Each has sub-dimensions rated on calibrated scales.

#### 1. SPECTRAL BALANCE
*How well the frequency spectrum is managed*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Low-end weight | Thin ↔ Boomy | Reference: genre-appropriate low end |
| Mid-range presence | Hollow ↔ Boxy | Reference: vocal/instrument clarity |
| High-end air | Dull ↔ Harsh | Reference: crisp without sibilance |
| Spectral masking | Cluttered ↔ Clear | Reference: each element has space |

#### 2. SPATIAL PRESENTATION
*How the mix occupies the stereo field and depth*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Stereo width | Mono ↔ Hyper-wide | Reference: appropriate for genre |
| Depth layering | Flat ↔ 3D | Reference: front-to-back separation |
| Instrument separation | Stacked ↔ Placed | Reference: can point to each element |

#### 3. DYNAMIC EXPRESSION
*How dynamics shape the listening experience*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Macro dynamics | Flat ↔ Dramatic | Reference: energy arc of the arrangement |
| Micro dynamics | Squashed ↔ Breathing | Reference: transient preservation |
| Loudness | Quiet ↔ Slammed | Reference: competitive loudness without sacrifice |

#### 4. TIMBRAL QUALITY
*The character and quality of sounds used*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Sound selection | Generic ↔ Distinctive | Reference: sounds match the artistic vision |
| Textural interest | Plain ↔ Rich | Reference: layering and evolution |
| Harmonic richness | Thin ↔ Full | Reference: satisfying frequency content |

#### 5. STRUCTURAL ENGAGEMENT
*How the arrangement holds attention*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Hook strength | Forgettable ↔ Infectious | Reference: something you'd hum later |
| Section contrast | Monotonous ↔ Varied | Reference: clear verse/chorus differentiation |
| Arrangement pacing | Dragging ↔ Rushed | Reference: natural flow between sections |
| Repetition balance | Under-repeated ↔ Over-repeated | Reference: develops without becoming stale |

#### 6. EMOTIONAL RESONANCE
*The emotional impact and authenticity*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Mood clarity | Confused ↔ Focused | Reference: clear emotional direction |
| Emotional arc | Static ↔ Journey | Reference: takes you somewhere |
| Authenticity | Contrived ↔ Genuine | Reference: feels real and intentional |
| Connection | Distant ↔ Intimate | Reference: makes you feel something |

#### 7. TECHNICAL EXECUTION
*The precision and quality of the production*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Mix clarity | Muddy ↔ Pristine | Reference: everything audible |
| Timing precision | Sloppy ↔ Locked | Reference: appropriate groove feel |
| Tuning accuracy | Off ↔ Perfect | Reference: intentional pitch choices |
| Recording quality | Lo-fi ↔ Studio | Reference: appropriate for genre |

#### 8. MARKET READINESS
*How the track compares to commercially released music*

| Sub-dimension | Scale | Anchors |
|--------------|-------|---------|
| Genre fit | Outlier ↔ Authentic | Reference: recognizable within genre |
| Competitive quality | Bedroom ↔ Professional | Reference: could sit next to a Spotify playlist |
| Release readiness | Early draft ↔ Ship it | Reference: ready for distribution |

### Reviewer Interaction

Reviewers don't rate all 32 sub-dimensions. Instead:

1. **Quick triage**: Rate each of the 8 top-level dimensions on a 7-point bipolar scale (30 seconds)
2. **Auto-deepdive**: The 2-3 lowest-scoring dimensions expand to show sub-dimensions (30 seconds each)
3. **Behavioral context**: If behavioral data shows engagement drops in specific sections, those sections are highlighted for comment

Total time: ~2-3 minutes for structured ratings (in addition to free-text feedback).

---

## Pillar 3: Adaptive Review Engine

### How It Works

The review form is **dynamically generated** based on multiple contextual signals:

```
Context Signals → Adaptive Engine → Personalized Form
     │                                     │
     ├── Track genre                       ├── Relevant dimensions emphasized
     ├── Track type (instrumental/vocal)   ├── Genre-specific terminology
     ├── Artist's specific questions       ├── Artist concern → targeted questions
     ├── Reviewer's expertise profile      ├── Complexity matched to skill
     ├── Behavioral data (real-time)       ├── "You replayed 1:30-2:00 — tell us about that"
     ├── Previous reviews on this track    ├── Consensus-seeking / tie-breaking questions
     └── Package type                      └── Depth matched to package
```

### Genre Adaptation Rules

| Genre Cluster | Emphasized Dimensions | De-emphasized | Special Questions |
|--------------|----------------------|---------------|-------------------|
| Electronic / EDM | Spectral Balance, Spatial, Timbral | Tuning accuracy | Drop impact, energy build, sound design |
| Hip-Hop / Rap | Structural, Emotional (flow) | Spatial depth | Flow assessment, lyrical clarity, 808 character |
| Rock / Alternative | Dynamic Expression, Emotional | Spatial width | Guitar tone, drum punch, vocal energy |
| Pop | Structural (hooks), Market Readiness | Timbral complexity | Hook memorability, production polish, radio-readiness |
| R&B / Soul | Emotional, Timbral, Technical (vocals) | Loudness | Vocal tone, groove feel, arrangement sophistication |
| Ambient / Experimental | Timbral, Spatial, Emotional | Market Readiness | Textural evolution, immersiveness, mood sustain |

### Behavioral-Driven Questions

When we detect specific behavioral patterns during listening, we inject targeted questions:

| Behavioral Signal | Injected Question |
|-------------------|-------------------|
| Replayed section at 1:30-2:00 | "You replayed the section at 1:30. What caught your attention there?" |
| Skipped ahead at 0:45 | "You skipped ahead around 0:45. What caused you to lose interest?" |
| Paused for >5s at 2:30 | "You paused at 2:30. Was something happening there that made you think?" |
| Volume up at 3:00 | "You turned up the volume around 3:00. Why?" |
| Didn't reach 75% of track | "You didn't listen to the last quarter. Why did you stop?" |

### Consensus-Seeking Mode

When previous reviews on the same track show disagreement on a dimension:

- If 2 reviewers rated spectral balance as "great" and 2 as "needs work":
  - New reviewer gets: "Previous listeners disagree about the low end. Some think it's perfect, others think it's muddy. **What's your take?** Be specific about what you hear."
- This resolves controversies with each additional review, creating **progressive consensus refinement**.

---

## Pillar 4: Reviewer Calibration System

### The Problem

A "4 out of 5" means completely different things to different people. Without calibration, aggregated scores are noisy and unreliable.

### Calibration Methodology

#### 1. Onboarding Calibration (One-Time)

During reviewer onboarding, present 3 short reference clips (30 seconds each) spanning quality levels:
- **Reference A**: Professionally mastered, released track (anonymous)
- **Reference B**: Good demo-quality track with identifiable issues
- **Reference C**: Early-stage track with multiple clear issues

Ask the reviewer to rate each on the 8 dimensions. Compare their ratings to the **expert consensus** (pre-rated by a panel of professional audio engineers).

**Result**: A per-dimension calibration offset. If they consistently rate 1 point higher than consensus, their future ratings are adjusted.

#### 2. Hidden Reference Tracks (Ongoing)

Periodically (~every 10th review), assign the reviewer a calibration track disguised as a normal assignment. These are:
- Previously released tracks with known quality characteristics
- Tracks that have already received 20+ reviews (stable consensus)

The reviewer's ratings are compared to the established consensus. This continuously updates their calibration profile.

#### 3. Cross-Reviewer Validation (Continuous)

For every track with 3+ reviews:
- Compute each reviewer's deviation from the consensus
- Reviewers who consistently align with the eventual consensus get higher `calibrationScore`
- Reviewers who are consistent outliers get lower weight (but aren't penalized — they may be catching things others miss)

### Reviewer Profile Metrics

```typescript
interface ReviewerCalibrationProfile {
  // Per-dimension calibration
  dimensionBias: Record<string, number>;        // e.g., { spectralBalance: +0.3, emotional: -0.5 }
  dimensionConfidence: Record<string, number>;   // How reliable they are per dimension (0-1)

  // Overall metrics
  calibrationScore: number;      // 0-1, how well they predict consensus
  specificityScore: number;      // 0-1, how actionable their text is
  consistencyScore: number;      // 0-1, how stable their ratings are across similar tracks
  behavioralAlignment: number;   // 0-1, how well behavior matches explicit feedback
  expertiseLevel: 'NOVICE' | 'DEVELOPING' | 'SKILLED' | 'EXPERT';

  // Genre expertise
  genreExpertise: Record<string, number>;  // e.g., { electronic: 0.9, hiphop: 0.3 }
}
```

### How Calibration Affects Output

1. **Consensus Calculation**: Calibrated scores are used instead of raw scores
2. **Confidence Intervals**: Narrow for well-calibrated reviewers, wide for uncalibrated
3. **Expert Flagging**: When a high-calibration reviewer spots something others missed, it's highlighted
4. **Text Weight**: Reviews from high-specificity reviewers are featured more prominently

---

## Pillar 5: Consensus Synthesis Engine

### The Problem

Artists currently see a carousel of individual reviews. They must mentally synthesize patterns across reviews. This is:
- Cognitively expensive
- Biased by recency and emotional reactions
- Unable to weight reviewer quality

### The Solution: AI-Powered Feedback Synthesis

For every track with 3+ completed reviews, generate a **Feedback Synthesis Report**:

```typescript
interface FeedbackSynthesis {
  trackId: string;
  generatedAt: Date;
  reviewCount: number;
  confidenceLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';  // Based on review count + calibration

  // Per-dimension synthesis
  dimensions: Array<{
    dimension: string;
    calibratedScore: number;       // Confidence-weighted average
    confidenceInterval: [number, number]; // 95% CI
    agreement: 'CONSENSUS' | 'MIXED' | 'DIVIDED';
    summaryStatement: string;      // "Your low end is well-controlled but 2/5 reviewers noted slight muddiness around 200Hz"
    behavioralEvidence?: string;   // "3 reviewers replayed the chorus, suggesting strong hook"
  }>;

  // Action Priority Matrix
  actionItems: Array<{
    what: string;           // "Reduce low-mid buildup around 200-300Hz"
    why: string;            // "3/5 reviewers flagged muddy low end; behavioral data shows 2 listeners lost engagement at bass-heavy sections"
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    effort: 'QUICK_FIX' | 'SESSION_WORK' | 'MAJOR_REVISION';
    confidence: number;     // 0-1 based on reviewer agreement + calibration
    dimension: string;      // Which dimension this addresses
    references: string[];   // Specific reviewer quotes
  }>;

  // Strength Signature
  strengths: Array<{
    what: string;
    evidence: string;       // Combined text + behavioral evidence
    dimension: string;
  }>;

  // Controversial Points
  controversies: Array<{
    topic: string;
    sideA: { opinion: string; reviewerCount: number };
    sideB: { opinion: string; reviewerCount: number };
    resolution?: string;    // If behavioral data or calibration breaks the tie
  }>;

  // Behavioral Consensus
  behavioralInsights: {
    hottestMoments: Array<{ start: number; end: number; signal: string }>;  // Most replayed sections
    dropOffPoints: Array<{ position: number; reviewerCount: number }>;      // Where listeners lost interest
    attentionCurve: number[];  // Aggregated engagement curve
  };

  // One-Line Verdict
  headline: string;  // "Strong songwriting with mix clarity issues — 2 targeted fixes would make this release-ready"
}
```

### Synthesis Algorithm

1. **Collect** all completed reviews for the track
2. **Calibrate** raw scores using each reviewer's calibration profile
3. **Compute** per-dimension confidence-weighted means and intervals
4. **Detect agreement** per dimension (Krippendorff's alpha > 0.67 = consensus)
5. **Extract action items** from free-text using NLP (keyword extraction + sentiment)
6. **Cross-reference behavioral data** to validate and enrich
7. **Rank action items** by (impact × confidence × inverse_effort)
8. **Generate** natural language synthesis statements
9. **Cache** the report and re-generate when new reviews come in

### Confidence Levels

| Reviews | Calibration Quality | Level |
|---------|-------------------|-------|
| 3-4 | Mixed | LOW |
| 3-4 | High | MODERATE |
| 5-7 | Mixed | MODERATE |
| 5-7 | High | HIGH |
| 8+ | Any | HIGH |
| 8+ | High | VERY_HIGH |

---

## Pillar 6: Artist Growth Intelligence

### Concept

Track how an artist's feedback scores evolve **across all their tracks over time**. This transforms MixReflect from a "get feedback on one track" tool into a **long-term growth platform** — dramatically increasing retention and lifetime value.

### Growth Profile

```typescript
interface ArtistGrowthProfile {
  artistId: string;
  tracksAnalyzed: number;
  timespan: { first: Date; latest: Date };

  // Per-dimension trajectory
  dimensionTrajectories: Array<{
    dimension: string;
    scores: Array<{ trackId: string; date: Date; calibratedScore: number }>;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    velocity: number;  // Rate of change per track
    currentLevel: number;
    percentileInGenre: number;  // Where they sit relative to other artists in their genre
  }>;

  // Persistent patterns
  persistentStrengths: string[];     // Dimensions consistently scored high across tracks
  persistentWeaknesses: string[];    // Dimensions consistently scored low
  recentBreakthroughs: string[];     // Dimensions that recently showed significant improvement
  plateaus: string[];                // Dimensions that have stalled

  // Recommended Focus Areas (AI-generated)
  recommendations: Array<{
    area: string;
    reason: string;
    potentialImpact: string;
    resources?: string[];  // Optional learning resources
  }>;

  // Milestones
  milestones: Array<{
    date: Date;
    type: 'FIRST_TRACK' | 'DIMENSION_BREAKTHROUGH' | 'CONSISTENT_IMPROVEMENT' | 'RELEASE_READY_ACHIEVED';
    description: string;
  }>;
}
```

### Visualization

The Artist Growth Dashboard shows:
1. **Radar chart** comparing current dimension scores to their earliest track
2. **Sparkline trends** per dimension over time
3. **Genre percentile rank** ("Your mixing is in the top 30% of electronic producers on MixReflect")
4. **Improvement velocity badges** ("Your spectral balance improved 40% over your last 3 tracks")
5. **AI coaching suggestions** ("Your arrangement has plateaued — try studying song structure in tracks like [X]")

---

## Pillar 7: Feedback Quality Scoring

### Text Quality Analysis

Every free-text response is scored on multiple dimensions:

```typescript
interface TextQualityScore {
  specificity: number;     // 0-1: References specific elements, timestamps, frequencies
  actionability: number;   // 0-1: Contains concrete suggestions the artist can act on
  technicalDepth: number;  // 0-1: Uses appropriate production terminology
  uniqueness: number;      // 0-1: Not generic/templated (compared to reviewer's past responses)
  behavioralMatch: number; // 0-1: Consistent with what behavioral data shows
  overallQuality: number;  // Weighted composite
}
```

### Quality Signals (Upgraded from Current)

Current system checks for music keywords and word count. New system scores:

1. **Specificity markers**:
   - Timestamp references (e.g., "at 1:30")
   - Frequency references (e.g., "200Hz", "low-mids")
   - Element references (e.g., "the snare", "lead vocal")
   - Section references (e.g., "in the chorus", "during the bridge")
   - Tool/technique references (e.g., "sidechain", "parallel compression")

2. **Actionability markers**:
   - Suggestion patterns ("try", "consider", "you could")
   - Comparison patterns ("compared to", "similar to", "instead of")
   - Causal reasoning ("because", "which causes", "the result is")
   - Before/after framing ("currently X, but could be Y")

3. **Depth markers**:
   - Multi-dimensional observations (mentions 2+ different aspects)
   - Relationship identification (how elements interact)
   - Priority indication (what matters most vs. nice-to-have)

4. **Anti-quality signals**:
   - Generic praise ("sounds good", "nice beat", "keep it up")
   - Template responses (high similarity to reviewer's past reviews)
   - Contradiction with behavioral data
   - Extremely short responses that technically meet word count

### Quality Impact

- **High quality feedback** → featured first in synthesis, reviewer earns reputation boost
- **Low quality feedback** → still accepted but weighted lower in synthesis, reviewer sees quality tips
- **Very low quality** → flagged for review, possible quality gate (must improve before next review)

---

## Patent Claims

The following novel combinations are potentially patentable:

### Claim 1: Behavioral-Explicit Feedback Fusion
A system and method for validating subjective music feedback by cross-referencing explicitly provided ratings and textual feedback with passively captured behavioral listening data (seek patterns, replay zones, pause points, attention curves) to compute a behavioral-explicit alignment score that weights the reliability of each piece of feedback.

### Claim 2: Adaptive Music Assessment Framework
A system and method for dynamically generating context-aware music feedback forms that adapt their content based on: (a) track genre and characteristics, (b) reviewer expertise profile, (c) real-time behavioral listening signals, (d) emerging consensus from previous reviewers, and (e) artist-specified focus areas — producing optimally targeted assessment instruments for each unique track-reviewer pair.

### Claim 3: Calibrated Multi-Reviewer Consensus Synthesis
A system and method for synthesizing multi-reviewer music feedback into confidence-weighted consensus reports using: (a) per-reviewer calibration profiles derived from hidden reference track evaluations and cross-reviewer validation, (b) per-dimension agreement detection using inter-rater reliability metrics, (c) behavioral data corroboration, and (d) action item extraction with impact-effort-confidence ranking.

### Claim 4: Perceptual Dimension Decomposition for Music Feedback
A system and method for structuring subjective music quality assessment along psychoacoustically-grounded perceptual dimensions (spectral balance, spatial presentation, dynamic expression, timbral quality, structural engagement, emotional resonance, technical execution, market readiness) with per-dimension calibrated scoring and sub-dimension conditional deep-dives triggered by low top-level ratings.

### Claim 5: Longitudinal Artist Development Intelligence
A system and method for tracking and analyzing an artist's growth trajectory across multiple music submissions by computing per-dimension improvement velocity, persistent pattern detection, genre-relative percentile positioning, and generating personalized development recommendations based on the highest-ROI improvement areas.

---

## Data Models

### New Prisma Models

```prisma
// ── Behavioral Listening Intelligence ──

model ListenBehavior {
  id              String   @id @default(cuid())
  reviewId        String   @unique
  trackDuration   Int?     // Track length in seconds (for normalization)
  completionRate  Float    @default(0) // 0-1: furthest position / track duration
  attentionScore  Float    @default(0) // 0-1: active time / session time
  firstSkipAt     Int?     // Seconds into track of first forward seek
  replayZones     Json?    // Array of {start, end, count}
  skipZones       Json?    // Array of {start, end}
  pausePoints     Json?    // Array of {position, duration}
  engagementCurve Json?    // Array of per-10s scores (0-1)
  rawEvents       Json?    // Full event log (compressed)
  behavioralAlignmentScore Float? // Computed: how well behavior matches explicit feedback
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  Review          Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId])
}

// ── Perceptual Dimension Framework ──

model FeedbackDimension {
  id              String   @id @default(cuid())
  key             String   @unique // e.g., "spectral_balance", "structural_engagement"
  label           String   // "Spectral Balance"
  category        String   // "TECHNICAL" | "CREATIVE" | "MARKET"
  sortOrder       Int      @default(0)
  subDimensions   Json?    // Array of {key, label, scaleMin, scaleMax, anchorLow, anchorHigh}
  genreWeights    Json?    // Record<genreId, weight> — how important this dimension is per genre
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  ReviewDimensionScore ReviewDimensionScore[]
}

model ReviewDimensionScore {
  id              String   @id @default(cuid())
  reviewId        String
  dimensionId     String
  rawScore        Float    // Reviewer's raw rating (1-7 scale)
  calibratedScore Float?   // After applying reviewer's calibration offset
  subScores       Json?    // Record<subDimensionKey, score>
  confidence      Float?   // How confident this score is (based on reviewer calibration)
  createdAt       DateTime @default(now())

  Review          Review            @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  Dimension       FeedbackDimension @relation(fields: [dimensionId], references: [id])

  @@unique([reviewId, dimensionId])
  @@index([reviewId])
  @@index([dimensionId])
}

// ── Reviewer Calibration System ──

model ReviewerCalibration {
  id                     String   @id @default(cuid())
  userId                 String   @unique
  calibrationScore       Float    @default(0.5) // 0-1: overall reliability
  specificityScore       Float    @default(0.5)
  consistencyScore       Float    @default(0.5)
  behavioralAlignment    Float    @default(0.5)
  expertiseLevel         String   @default("NOVICE") // NOVICE | DEVELOPING | SKILLED | EXPERT
  dimensionBias          Json?    // Record<dimensionKey, biasOffset>
  dimensionConfidence    Json?    // Record<dimensionKey, confidenceScore>
  genreExpertise         Json?    // Record<genreId, expertiseScore>
  calibrationHistory     Json?    // Array of calibration events
  totalCalibratedReviews Int      @default(0)
  lastCalibratedAt       DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  User                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([calibrationScore])
}

// ── Consensus Synthesis Engine ──

model FeedbackSynthesis {
  id                     String   @id @default(cuid())
  trackId                String
  version                Int      @default(1) // Incremented each regeneration
  reviewCount            Int
  confidenceLevel        String   // LOW | MODERATE | HIGH | VERY_HIGH
  headline               String   // One-line verdict
  dimensionSyntheses     Json     // Array of per-dimension synthesis objects
  actionItems            Json     // Ranked action priority matrix
  strengths              Json     // Identified strengths with evidence
  controversies          Json?    // Points of disagreement between reviewers
  behavioralInsights     Json?    // Aggregated behavioral patterns
  rawComputations        Json?    // Debug: intermediate computation data
  generatedAt            DateTime @default(now())
  expiresAt              DateTime? // Cache expiry — regenerate after new reviews

  Track                  Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@index([trackId])
  @@index([trackId, version])
}

// ── Artist Growth Intelligence ──

model ArtistGrowthSnapshot {
  id                     String   @id @default(cuid())
  artistProfileId        String
  snapshotDate           DateTime @default(now())
  tracksAnalyzed         Int
  dimensionScores        Json     // Record<dimensionKey, {score, percentile, trend, velocity}>
  persistentStrengths    Json?    // Array of dimension keys
  persistentWeaknesses   Json?    // Array of dimension keys
  recentBreakthroughs    Json?    // Array of {dimension, improvement}
  recommendations        Json?    // AI-generated focus areas
  milestones             Json?    // Array of milestone events

  ArtistProfile          ArtistProfile @relation(fields: [artistProfileId], references: [id], onDelete: Cascade)

  @@index([artistProfileId])
  @@index([artistProfileId, snapshotDate])
}

// ── Calibration Tracks ──

model CalibrationTrack {
  id                     String   @id @default(cuid())
  title                  String
  sourceUrl              String
  sourceType             String   @default("UPLOAD")
  genreId                String?
  expertConsensus        Json     // Record<dimensionKey, {score, confidence}>
  qualityTier            String   // REFERENCE_HIGH | REFERENCE_MID | REFERENCE_LOW
  totalCalibrations      Int      @default(0)
  isActive               Boolean  @default(true)
  createdAt              DateTime @default(now())

  @@index([isActive])
  @@index([qualityTier])
}
```

### Existing Model Changes

```prisma
// Add to Review model:
model Review {
  // ... existing fields ...

  // NEW: Link to behavioral data and dimension scores
  ListenBehavior        ListenBehavior?
  ReviewDimensionScore  ReviewDimensionScore[]

  // NEW: Feedback quality scoring
  textQualityScore      Float?   // 0-1 composite
  textSpecificity       Float?
  textActionability     Float?
  textTechnicalDepth    Float?
  behavioralAlignment   Float?   // 0-1 match between behavior and explicit feedback
}

// Add to Track model:
model Track {
  // ... existing fields ...

  // NEW: Consensus synthesis
  FeedbackSynthesis     FeedbackSynthesis[]
  latestSynthesisId     String?  // Quick access to latest report
}

// Add to ArtistProfile model:
model ArtistProfile {
  // ... existing fields ...

  // NEW: Growth intelligence
  ArtistGrowthSnapshot  ArtistGrowthSnapshot[]
  lastGrowthSnapshotAt  DateTime?
}

// Add to User model:
model User {
  // ... existing fields ...

  // NEW: Calibration
  ReviewerCalibration   ReviewerCalibration?
}
```

---

## Implementation Phases

### Phase 1: Behavioral Listening Intelligence (Week 1-2)
**Impact: HIGH | Effort: MEDIUM**

1. Enhance audio player to capture seek/replay/pause/volume events
2. Buffer events client-side, send with heartbeat batches
3. Create `ListenBehavior` model and API endpoint
4. Compute derived metrics server-side (completion rate, attention score, engagement curve, replay zones)
5. Display behavioral insights on artist track dashboard ("3 reviewers replayed your chorus")

### Phase 2: Enhanced Feedback Quality Scoring (Week 2-3)
**Impact: HIGH | Effort: LOW**

1. Upgrade text analysis with specificity/actionability/depth scoring
2. Compute `textQualityScore` on review submission
3. Use quality scores to weight reviews in existing summary banner
4. Show quality tips to reviewers when score is low

### Phase 3: Perceptual Dimension Framework (Week 3-5)
**Impact: HIGH | Effort: HIGH**

1. Create `FeedbackDimension` seed data (8 dimensions + sub-dimensions)
2. Build adaptive dimension rating UI (quick triage → conditional deep-dive)
3. Capture `ReviewDimensionScore` on submission
4. Update artist dashboard to show per-dimension analytics

### Phase 4: Consensus Synthesis Engine (Week 5-7)
**Impact: VERY HIGH | Effort: HIGH**

1. Build synthesis algorithm (calibrated aggregation + agreement detection)
2. Extract action items from free-text
3. Generate natural language synthesis reports
4. Build Feedback Synthesis Report UI for artists
5. Auto-generate/refresh on new review completion

### Phase 5: Reviewer Calibration System (Week 7-9)
**Impact: HIGH | Effort: MEDIUM**

1. Add calibration assessment to onboarding flow
2. Create `CalibrationTrack` model and admin interface
3. Build calibration scoring logic
4. Apply calibration offsets to dimension scores in synthesis
5. Display reviewer expertise badges

### Phase 6: Artist Growth Intelligence (Week 9-11)
**Impact: VERY HIGH | Effort: MEDIUM**

1. Build `ArtistGrowthSnapshot` generation logic (triggered after each track completes)
2. Compute per-dimension trajectories, trends, percentiles
3. Build Artist Growth Dashboard UI (radar chart, sparklines, milestones)
4. Generate personalized recommendations

### Phase 7: Adaptive Review Engine (Week 11-13)
**Impact: HIGH | Effort: HIGH**

1. Build genre adaptation rules engine
2. Implement behavioral-driven question injection
3. Implement consensus-seeking mode for divided reviews
4. Build expertise-adaptive form complexity
5. A/B test adaptive vs. static forms

---

## Success Metrics

| Metric | Current | Target | Why |
|--------|---------|--------|-----|
| Avg review text quality score | ~0.4 | 0.7+ | More actionable feedback |
| Artist NPS on feedback quality | Unknown | 50+ | Artists love the insights |
| Reviewer time-to-complete | ~8 min | ~6 min | Adaptive form is more efficient |
| Artist retention (monthly) | ~30% | 50%+ | Growth tracking creates stickiness |
| Consensus convergence (reviews needed) | ~8 | ~5 | Calibrated reviewers are more reliable |
| Behavioral-explicit alignment | Unknown | 0.75+ | Reviews are trustworthy |

---

*This document is the technical specification for the MixReflect Feedback Intelligence Engine. It represents a fundamental leap beyond any existing music feedback platform and creates multiple defensible competitive advantages.*
