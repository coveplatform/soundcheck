# Review V2 Integration Guide

## ✅ COMPLETED

### 1. Database Schema
- ✅ All new enums added
- ✅ All new fields added to Review model
- ✅ reviewerExpertise added to ArtistProfile
- ✅ Migrated to production database

### 2. Form Components (All 5 sections created)
- ✅ `technical-feedback-section.tsx` - Low end, vocals, high end, stereo, dynamics
- ✅ `arrangement-feedback-section.tsx` - Energy, repetition, pacing
- ✅ `emotional-impact-section.tsx` - Emotions, memorability, originality, playlist action
- ✅ `actionable-feedback-section.tsx` - Best moment, weakness, quick win
- ✅ `context-next-steps-section.tsx` - Target audience, next focus, placement, quality

### 3. Form Hooks Updated
- ✅ All new state variables added
- ✅ Validation updated with v2 requirements
- ✅ getFormData() updated to include all v2 fields
- ⏳ Draft save/load (needs v2 fields added)
- ⏳ Return statement (needs v2 exports added)

---

## 🚀 QUICK INTEGRATION STEPS

### Step 1: Update Review Submission API

**File:** `src/app/api/reviews/route.ts` (or wherever POST /api/reviews lives)

**Add to request body validation:**
```typescript
// V2 enhanced feedback fields
lowEndClarity: z.enum(["PERFECT", "KICK_TOO_LOUD", "BASS_TOO_LOUD", "BOTH_MUDDY", "BARELY_AUDIBLE"]).optional(),
vocalClarity: z.enum(["CRYSTAL_CLEAR", "SLIGHTLY_BURIED", "BURIED", "TOO_LOUD", "NOT_APPLICABLE"]).optional(),
highEndQuality: z.enum(["PERFECT", "TOO_DULL", "TOO_HARSH", "ACCEPTABLE"]).optional(),
stereoWidth: z.enum(["TOO_NARROW", "GOOD_BALANCE", "TOO_WIDE"]).optional(),
dynamics: z.enum(["GREAT_DYNAMICS", "ACCEPTABLE", "TOO_COMPRESSED", "TOO_QUIET"]).optional(),
energyCurve: z.enum(["BUILDS_PERFECTLY", "STAYS_FLAT", "BUILDS_NO_PAYOFF", "ALL_OVER_PLACE"]).optional(),
tooRepetitive: z.boolean().optional(),
repetitiveNote: z.string().optional(),
lostInterestAt: z.number().optional(),
lostInterestReason: z.string().optional(),
trackLength: z.enum(["TOO_SHORT", "PERFECT", "BIT_LONG", "WAY_TOO_LONG"]).optional(),
emotionalImpact: z.array(z.string()).optional(),
memorableMoment: z.string().optional(),
playlistAction: z.enum(["ADD_TO_LIBRARY", "LET_PLAY", "SKIP", "DISLIKE"]).optional(),
biggestWeaknessSpecific: z.string().optional(),
quickWin: z.string().optional(),
targetAudience: z.array(z.string()).optional(),
nextFocus: z.enum(["MIXING", "ARRANGEMENT", "SOUND_DESIGN", "SONGWRITING", "PERFORMANCE", "READY_TO_RELEASE"]).optional(),
expectedPlacement: z.enum(["EDITORIAL", "SOUNDCLOUD_TRENDING", "CLUB", "COFFEE_SHOP", "VIDEO_GAME", "AD", "NOWHERE"]).optional(),
qualityLevel: z.enum(["NOT_READY", "DEMO_STAGE", "ALMOST_THERE", "RELEASE_READY", "PROFESSIONAL"]).optional(),
```

**Update Prisma create:**
```typescript
await prisma.review.update({
  where: { id: reviewId },
  data: {
    status: "COMPLETED",
    firstImpression,
    productionScore,
    vocalScore,
    originalityScore,
    // ... existing fields ...

    // V2 fields
    lowEndClarity,
    vocalClarity,
    highEndQuality,
    stereoWidth,
    dynamics,
    energyCurve,
    tooRepetitive,
    repetitiveNote,
    lostInterestAt,
    lostInterestReason,
    trackLength,
    emotionalImpact: emotionalImpact ? JSON.stringify(emotionalImpact) : null,
    memorableMoment,
    playlistAction,
    biggestWeaknessSpecific,
    quickWin,
    targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
    nextFocus,
    expectedPlacement,
    qualityLevel,
  },
});
```

### Step 2: Update Review Page to Use New Components

**File:** `src/app/(dashboard)/reviewer/review/[id]/page.tsx`

**Import new sections:**
```typescript
import { TechnicalFeedbackSection } from "./components/technical-feedback-section";
import { ArrangementFeedbackSection } from "./components/arrangement-feedback-section";
import { EmotionalImpactSection } from "./components/emotional-impact-section";
import { ActionableFeedbackSection } from "./components/actionable-feedback-section";
import { ContextNextStepsSection } from "./components/context-next-steps-section";
```

**Add sections in the form (after existing first impression section):**
```tsx
{/* Technical Feedback - NEW */}
<TechnicalFeedbackSection
  lowEndClarity={lowEndClarity}
  setLowEndClarity={setLowEndClarity}
  vocalClarity={vocalClarity}
  setVocalClarity={setVocalClarity}
  highEndQuality={highEndQuality}
  setHighEndQuality={setHighEndQuality}
  stereoWidth={stereoWidth}
  setStereoWidth={setStereoWidth}
  dynamics={dynamics}
  setDynamics={setDynamics}
/>

{/* Arrangement Feedback - NEW */}
<ArrangementFeedbackSection
  energyCurve={energyCurve}
  setEnergyCurve={setEnergyCurve}
  tooRepetitive={tooRepetitive}
  setTooRepetitive={setTooRepetitive}
  repetitiveNote={repetitiveNote}
  setRepetitiveNote={setRepetitiveNote}
  lostInterestAt={lostInterestAt}
  setLostInterestAt={setLostInterestAt}
  lostInterestReason={lostInterestReason}
  setLostInterestReason={setLostInterestReason}
  trackLength={trackLength}
  setTrackLength={setTrackLength}
  playerSeconds={playerSeconds}
  addTimestampNote={addTimestampNote}
/>

{/* Emotional Impact - NEW */}
<EmotionalImpactSection
  emotionalImpact={emotionalImpact}
  setEmotionalImpact={setEmotionalImpact}
  memorableMoment={memorableMoment}
  setMemorableMoment={setMemorableMoment}
  originalityScore={originalityScore}
  setOriginalityScore={setOriginalityScore}
  playlistAction={playlistAction}
  setPlaylistAction={setPlaylistAction}
/>

{/* Actionable Feedback - NEW */}
<ActionableFeedbackSection
  bestPart={bestPart}
  setBestPart={setBestPart}
  biggestWeaknessSpecific={biggestWeaknessSpecific}
  setBiggestWeaknessSpecific={setBiggestWeaknessSpecific}
  quickWin={quickWin}
  setQuickWin={setQuickWin}
  bestPartWords={bestPartWords}
  weaknessWords={weaknessWords}
  quickWinWords={quickWinWords}
  addTimestampNote={addTimestampNote}
  playerSeconds={playerSeconds}
/>

{/* Context & Next Steps - NEW */}
<ContextNextStepsSection
  targetAudience={targetAudience}
  setTargetAudience={setTargetAudience}
  nextFocus={nextFocus}
  setNextFocus={setNextFocus}
  expectedPlacement={expectedPlacement}
  setExpectedPlacement={setExpectedPlacement}
  qualityLevel={qualityLevel}
  setQualityLevel={setQualityLevel}
/>
```

### Step 3: Complete Form Hooks Return Statement

**File:** `use-review-form.ts` (return statement at end of hook)

**Add to return object:**
```typescript
return {
  // ... existing exports ...

  // V2 state
  lowEndClarity,
  setLowEndClarity,
  vocalClarity,
  setVocalClarity,
  highEndQuality,
  setHighEndQuality,
  stereoWidth,
  setStereoWidth,
  dynamics,
  setDynamics,
  energyCurve,
  setEnergyCurve,
  tooRepetitive,
  setTooRepetitive,
  repetitiveNote,
  setRepetitiveNote,
  lostInterestAt,
  setLostInterestAt,
  lostInterestReason,
  setLostInterestReason,
  trackLength,
  setTrackLength,
  emotionalImpact,
  setEmotionalImpact,
  memorableMoment,
  setMemorableMoment,
  playlistAction,
  setPlaylistAction,
  biggestWeaknessSpecific,
  setBiggestWeaknessSpecific,
  quickWin,
  setQuickWin,
  targetAudience,
  setTargetAudience,
  nextFocus,
  setNextFocus,
  expectedPlacement,
  setExpectedPlacement,
  qualityLevel,
  setQualityLevel,

  // V2 computed
  weaknessWords,
  quickWinWords,
  meetsV2TextMinimum,
};
```

### Step 4: Update Review Display for Artists

**File:** `src/components/reviews/review-display.tsx` or track detail page

**Add v2 field display (with fallbacks):**
```tsx
{/* Show v2 technical feedback if available */}
{review.lowEndClarity && (
  <div className="space-y-2">
    <h4 className="font-semibold">Technical Feedback</h4>
    <div className="grid grid-cols-2 gap-2 text-sm">
      {review.lowEndClarity && (
        <div>Low End: {formatEnum(review.lowEndClarity)}</div>
      )}
      {review.vocalClarity && (
        <div>Vocals: {formatEnum(review.vocalClarity)}</div>
      )}
      {review.highEndQuality && (
        <div>High End: {formatEnum(review.highEndQuality)}</div>
      )}
      {review.dynamics && (
        <div>Dynamics: {formatEnum(review.dynamics)}</div>
      )}
    </div>
  </div>
)}

{/* Show quick win prominently */}
{review.quickWin && (
  <div className="p-4 bg-lime-50 border border-lime-200 rounded-lg">
    <p className="text-xs font-semibold text-lime-900 uppercase mb-1">🎯 Quick Win</p>
    <p className="text-sm text-lime-800">{review.quickWin}</p>
  </div>
)}

{/* Show quality level and next focus */}
{review.qualityLevel && (
  <div className="flex items-center gap-4 text-sm">
    <div>
      <span className="text-black/50">Quality:</span> {formatEnum(review.qualityLevel)}
    </div>
    {review.nextFocus && (
      <div>
        <span className="text-black/50">Focus Next:</span> {formatEnum(review.nextFocus)}
      </div>
    )}
  </div>
)}
```

**Helper function:**
```typescript
function formatEnum(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
```

---

## 📊 ANALYTICS INTEGRATION (Quick Win Queries)

### Most Common Technical Issues
```typescript
const technicalIssues = await prisma.review.groupBy({
  by: ['lowEndClarity'],
  where: { lowEndClarity: { not: 'PERFECT' } },
  _count: true,
});
```

### Average Quality Level by Artist
```typescript
const artistQuality = await prisma.review.groupBy({
  by: ['Track.artistId'],
  _avg: {
    // Map quality enum to numeric for averaging
  },
  where: { qualityLevel: { not: null } },
});
```

### Most Common Next Focus Suggestions
```typescript
const suggestions = await prisma.review.groupBy({
  by: ['nextFocus'],
  _count: true,
  orderBy: { _count: { nextFocus: 'desc' } },
});
```

---

## 🧪 TESTING CHECKLIST

- [ ] Can submit review with only v1 fields (backwards compat)
- [ ] Can submit review with v2 fields
- [ ] Validation works (required v2 fields checked)
- [ ] Draft save/load works with v2 fields
- [ ] Old reviews display correctly (v1)
- [ ] New reviews display correctly (v2)
- [ ] Analytics queries work with mixed v1/v2 data
- [ ] Mobile responsive (new sections)
- [ ] Form performance (no lag with all sections)

---

## 🎯 ROLLOUT STRATEGY

### Option A: Big Bang (All at Once)
1. Complete all integration steps above
2. Test thoroughly in staging
3. Deploy to production
4. Monitor for issues

### Option B: Feature Flag (Gradual)
1. Add feature flag: `ENABLE_REVIEW_V2`
2. Show v2 form to 10% of users
3. Monitor completion rates, bugs
4. Gradually increase to 100%

**Recommendation:** Option B (feature flag) for safer rollout.

---

## 📝 REMAINING WORK

1. **Complete form hooks** - Add v2 fields to draft save/load and return statement (15 mins)
2. **Update API** - Add v2 validation and save logic (15 mins)
3. **Integrate components** - Add 5 sections to review page (10 mins)
4. **Update review display** - Show v2 feedback to artists (20 mins)
5. **Test end-to-end** - Submit review, view feedback (15 mins)
6. **Analytics queries** - Basic aggregation of v2 data (30 mins)

**Total remaining:** ~2 hours

---

## 🚀 NEXT PHASE ENHANCEMENTS

Once core v2 is shipped and stable:

1. **Expertise-based questions** - Tailor form based on reviewer knowledge
2. **Waveform annotations** - Visual timestamp feedback
3. **Auto-summary** - AI-generated review summary
4. **Revision tracking** - See if artist implemented feedback
5. **Reviewer badges** - "Technical Expert", "Quick Win Master", etc.
