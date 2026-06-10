# Artist Experience Level & Feedback Focus Areas — Design

> **Problem**: Most reviewers aren't mixing experts. Generic reviews aren't valuable. Artists need control over what feedback they get, and reviewers need context about who they're writing for.

---

## The Two New Concepts

### 1. Artist Experience Level (per-track, set at submission)

| Value | Label | Description (shown to reviewer) | Reviewer Guidance |
|-------|-------|--------------------------------|-------------------|
| `BEGINNER` | Just Starting Out | "I'm new to music production and learning the basics" | Use plain language. Focus on what works vs what doesn't. Avoid jargon. Encouragement matters. |
| `INTERMEDIATE` | Getting Serious | "I know the fundamentals and want to improve" | Be constructive. Explain *why* something works or doesn't. Light technical language OK. |
| `ADVANCED` | Experienced Producer | "I've been producing for a while, I can handle detailed feedback" | Get technical. Mention specific frequencies, processing, arrangement techniques. Be direct. |
| `PROFESSIONAL` | Professional | "I release music commercially — hold nothing back" | Full depth. Compare to commercial references. Be brutally honest about release readiness. |

**Default**: `INTERMEDIATE` (safe middle ground if they skip it)

### 2. Feedback Focus Areas (per-track, artist picks 1-3 at submission)

| Value | Label | Icon | Description | What reviewer sees |
|-------|-------|------|-------------|-------------------|
| `OVERALL_VIBE` | Overall Vibe | 🎵 | "Does this feel good? Would you listen to it?" | Focus on emotional response, energy, whether it holds attention |
| `MIXING` | Mixing & Sound | 🎚️ | "How's the mix quality, levels, clarity?" | Focus on balance, EQ, compression, stereo image, loudness |
| `ARRANGEMENT` | Arrangement | 🎼 | "Does the structure work? Pacing, transitions?" | Focus on song structure, transitions, repetition, energy flow |
| `SONGWRITING` | Songwriting | ✍️ | "Melody, lyrics, hooks, emotional impact?" | Focus on melody, hooks, lyrics, chord progressions, emotional arc |
| `SOUND_DESIGN` | Sound Design | 🎛️ | "Are the sounds interesting and well-crafted?" | Focus on sound selection, synthesis, textures, creativity |
| `RELEASE_READINESS` | Release Readiness | 🚀 | "Is this ready to put out? What's holding it back?" | Focus on competitive quality, what needs fixing before release |

---

## How It Changes Each Touchpoint

### A. Track Submission Page (`/submit`, Step 2)

**Current**: Free-text "Feedback focus" textarea + genre selection
**New**: Replace the free-text with structured selectors:

```
┌─────────────────────────────────────────────┐
│ Step 2: Track Details                       │
│                                             │
│ Title: [_______________]                    │
│ Genres: [Electronic] [House] [+]            │
│                                             │
│ YOUR EXPERIENCE LEVEL                       │
│ Help reviewers tailor their feedback        │
│                                             │
│ ○ Just Starting Out                         │
│   "I'm learning the basics"                │
│ ● Getting Serious          ← default        │
│   "I know fundamentals, ready for feedback" │
│ ○ Experienced Producer                      │
│   "Give me the technical stuff"             │
│ ○ Professional                              │
│   "Hold nothing back"                       │
│                                             │
│ WHAT FEEDBACK DO YOU WANT? (pick 1-3)       │
│                                             │
│ [🎵 Overall Vibe]  [🎚️ Mixing & Sound]     │
│ [🎼 Arrangement]   [✍️ Songwriting]         │
│ [🎛️ Sound Design]  [🚀 Release Readiness]   │
│                                             │
│ ANYTHING SPECIFIC? (optional)               │
│ [free text — kept for specific requests     │
│  like "focus on the vocal at 1:30"]         │
│                                             │
│ Visibility: [Private] [Public]              │
└─────────────────────────────────────────────┘
```

**Keep the existing free-text** `feedbackFocus` field as an optional "Anything specific?" below the structured selectors. This handles edge cases like "I changed the bassline since last time, focus on that."

### B. Reviewer's Review Page (`/review/[id]`)

**Current**: Small amber "Artist note" box if feedbackFocus exists
**New**: Prominent context banner at top of the review form

```
┌─────────────────────────────────────────────────┐
│ 🎵 Track Title                                  │
│ Electronic, House · by ArtistName               │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 BEGINNER · Wants: Overall Vibe, Mixing   │ │
│ │                                             │ │
│ │ This artist is just starting out.           │ │
│ │ Use plain language — avoid jargon.          │ │
│ │ Focus on what works vs what doesn't.        │ │
│ │                                             │ │
│ │ 💬 "I changed the bass since last time,     │ │
│ │    curious if it sits better now"           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Audio Player]                                  │
└─────────────────────────────────────────────────┘
```

### C. Review Form Adaptation

The form sections **show/hide and reorder** based on the focus areas. The core required fields stay (first impression, would listen again, best moment, main feedback) but:

#### What Changes Per Focus Area

| Focus Area | Sections Shown | Placeholder Text Adapts | Technical Issues |
|-----------|---------------|------------------------|-----------------|
| **Overall Vibe** | First Impression ★, Would Listen Again ★, Playlist Action ★, Best Moment ★, Main Feedback ★ | "What's the vibe? How did it make you feel?" | Hidden |
| **Mixing & Sound** | First Impression, Technical Issues ★★, Main Feedback ★★ (mixing-specific prompts), Best Moment, Quality Level | "How's the mix balance? What needs fixing?" | Prominent, expanded |
| **Arrangement** | First Impression, Main Feedback ★★ (arrangement prompts), Best Moment, Next Focus | "Does the structure flow? Where does it drag?" | Hidden |
| **Songwriting** | First Impression, Would Listen Again, Best Moment ★★ (melody/hook prompts), Main Feedback ★★ | "Is the melody memorable? Do the lyrics land?" | Hidden |
| **Sound Design** | First Impression, Main Feedback ★★ (sound design prompts), Best Moment, Quality Level | "Are the sounds interesting? What stands out?" | Relevant subset |
| **Release Readiness** | All sections shown, Quality Level ★★, Next Focus ★★, Main Feedback ★★ | "Is this ready to release? What's the gap?" | Full set |

★ = emphasized/required, ★★ = primary focus section

#### What Changes Per Experience Level

| Level | Text Prompts | Technical Issues | Quality Level Options | Word Minimums |
|-------|-------------|-----------------|----------------------|---------------|
| **Beginner** | Simple language, examples in plain English | Simplified labels ("Bass too loud" not "Muddy low end") | 3 options: "Needs work", "Getting there", "Sounds good" | Lower (10/15 words) |
| **Intermediate** | Current language | Current labels | Current 5 options | Current (15/20 words) |
| **Advanced** | Technical prompts, mention frequencies/processing | Full technical labels + extras (phase issues, mono compat) | Current 5 options | Current (15/20 words) |
| **Professional** | Reference-track language, commercial comparison prompts | Full technical + mastering-specific | Current 5 + "Commercial grade" | Higher (20/25 words) |

### D. How Reviewer Sees the Context (Detail)

The context banner serves two purposes:
1. **Sets expectations** — reviewer knows what depth is appropriate
2. **Focuses attention** — reviewer knows what to listen for

The banner should feel like a **brief from the artist**, not a system message. Tone:

- Beginner + Overall Vibe: *"This artist is new to production and wants to know if the track vibes. Keep it encouraging and focus on what works vs what doesn't — no need to get technical."*
- Advanced + Mixing: *"Experienced producer looking for detailed mix feedback. Get specific — frequencies, processing, stereo image. They can handle it."*
- Professional + Release Readiness: *"Pro artist checking if this is release-ready. Compare to commercial references in the genre. Be direct about what's holding it back."*

---

## Schema Changes

### Track Model — New Fields

```prisma
model Track {
  // ... existing fields ...
  
  // NEW: Artist experience level for this track
  experienceLevel    String?   // BEGINNER | INTERMEDIATE | ADVANCED | PROFESSIONAL
  
  // NEW: Structured feedback focus areas (JSON array of strings)
  feedbackAreas      String[]  // ["OVERALL_VIBE", "MIXING", etc.] — max 3
  
  // KEEP: existing feedbackFocus as free-text "anything specific"
  feedbackFocus      String?   // renamed in UI to "Anything specific?"
}
```

**Why on Track not ArtistProfile?** Because experience level can change over time, and an artist might want different feedback types for different tracks. A beginner might submit one track wanting "overall vibe" and another wanting "mixing" once they feel more confident.

### No Review Model Changes Needed

The review form adapts client-side based on the Track's `experienceLevel` and `feedbackAreas`. We don't need to store which form variant was shown — the submitted data speaks for itself.

---

## API Changes

### `POST /api/tracks` — Accept new fields

```typescript
const createTrackSchema = z.object({
  // ... existing fields ...
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]).optional(),
  feedbackAreas: z.array(
    z.enum(["OVERALL_VIBE", "MIXING", "ARRANGEMENT", "SONGWRITING", "SOUND_DESIGN", "RELEASE_READINESS"])
  ).min(1).max(3).optional(),
  feedbackFocus: z.string().max(1000).optional(), // kept as free-text
});
```

### `GET /api/reviews/[id]` — Include new Track fields in response

The review fetch already includes `Track` with `feedbackFocus`. Just need to add `experienceLevel` and `feedbackAreas` to the select/include.

---

## Review Page Form Logic (Pseudocode)

```typescript
// Derive form config from track context
function getFormConfig(track: Track) {
  const level = track.experienceLevel ?? "INTERMEDIATE";
  const areas = track.feedbackAreas ?? ["OVERALL_VIBE"];
  
  const hasMixing = areas.includes("MIXING");
  const hasArrangement = areas.includes("ARRANGEMENT");
  const hasSongwriting = areas.includes("SONGWRITING");
  const hasSoundDesign = areas.includes("SOUND_DESIGN");
  const hasReleaseReadiness = areas.includes("RELEASE_READINESS");
  const hasOverallVibe = areas.includes("OVERALL_VIBE");
  
  return {
    // Section visibility
    showTechnicalIssues: hasMixing || hasSoundDesign || hasReleaseReadiness,
    showQualityLevel: hasMixing || hasReleaseReadiness || hasSoundDesign,
    showNextFocus: hasArrangement || hasReleaseReadiness,
    showPlaylistAction: hasOverallVibe || hasReleaseReadiness,
    
    // Always shown (core)
    showFirstImpression: true,
    showWouldListenAgain: true,
    showBestMoment: true,
    showMainFeedback: true,
    
    // Text prompts vary by level + area
    mainFeedbackPrompt: getMainPrompt(level, areas),
    bestMomentPrompt: getBestMomentPrompt(level, areas),
    
    // Word minimums vary by level
    mainFeedbackMinWords: level === "BEGINNER" ? 15 : level === "PROFESSIONAL" ? 25 : 20,
    bestMomentMinWords: level === "BEGINNER" ? 10 : 15,
    
    // Technical issues labels vary by level
    technicalIssueLabels: getTechnicalLabels(level),
    
    // Context banner
    contextBanner: buildContextBanner(level, areas, track.feedbackFocus),
  };
}
```

---

## Implementation Order

1. **Schema**: Add `experienceLevel` and `feedbackAreas` to Track model
2. **API**: Update `POST /api/tracks` to accept + store new fields
3. **Submit page**: Add experience level selector + feedback area chips to Step 2
4. **Review API**: Include new fields in review fetch response
5. **Review types**: Add `experienceLevel` and `feedbackAreas` to Review type's Track interface
6. **Review page**: Add context banner + form adaptation logic
7. **Review page**: Adapt placeholder text, labels, and word minimums

---

## Edge Cases

- **No areas selected**: Default to `["OVERALL_VIBE"]`
- **No experience level set**: Default to `INTERMEDIATE`
- **Existing tracks** (before migration): No `experienceLevel` or `feedbackAreas` → review form shows current behavior unchanged
- **Release Decision package**: Overrides this system — uses its own dedicated form regardless of focus areas

---

## What This Solves

| Problem | Solution |
|---------|----------|
| Non-expert reviewers give generic feedback | "Overall Vibe" focus means they just need to say if it vibes — that's genuinely useful |
| Expert feedback goes to beginners who can't use it | Experience level tells reviewers to use plain language |
| Artists get mixing feedback when they wanted arrangement help | Focus areas direct reviewer attention to what matters |
| Reviewers don't know how technical to be | Context banner sets the tone before they start |
| Every review feels the same | Form adapts — different prompts, different sections, different depth |
