# Review System V2 - Implementation Status

## ✅ PHASE 1: COMPLETED (Database & Schema)

### Database Schema Updates
**Status:** ✅ DEPLOYED TO PRODUCTION

**New Enums Added:**
- `LowEndClarity` - Kick/bass balance feedback
- `VocalClarity` - Vocal treatment in mix
- `HighEndQuality` - Brightness/harshness
- `StereoWidth` - Spaciousness
- `DynamicsQuality` - Compression/dynamic range
- `EnergyCurve` - How track builds over time
- `TrackLength` - Pacing feedback
- `PlaylistAction` - Intent to add/skip
- `NextFocus` - What artist should work on
- `ExpectedPlacement` - Where track could be placed
- `QualityLevel` - Production quality benchmark
- `ReviewerExpertise` - Reviewer's production knowledge

**New Fields Added to Review Model:**
```prisma
lowEndClarity          LowEndClarity?
vocalClarity           VocalClarity?
highEndQuality         HighEndQuality?
stereoWidth            StereoWidth?
dynamics               DynamicsQuality?
energyCurve            EnergyCurve?
tooRepetitive          Boolean?
repetitiveNote         String?
lostInterestAt         Int?
lostInterestReason     String?
trackLength            TrackLength?
emotionalImpact        Json?         // Array of emotions
memorableMoment        String?
playlistAction         PlaylistAction?
biggestWeaknessSpecific String?      // Replaces vague weakestPart
quickWin               String?       // One actionable fix
targetAudience         Json?         // Array of use cases
nextFocus              NextFocus?
expectedPlacement      ExpectedPlacement?
qualityLevel           QualityLevel?
reviewerExpertise      ReviewerExpertise?
```

**New Field Added to ArtistProfile:**
```prisma
reviewerExpertise      ReviewerExpertise?  // Save for future reviews
```

### Migration
- ✅ Schema pushed to production database
- ✅ All new fields are nullable (backwards compatible)
- ✅ Existing reviews continue to work
- ✅ Old review schema (v1) and new schema (v2) coexist

---

## ⏳ PHASE 2: IN PROGRESS (Form Components)

### Components Created
✅ `technical-feedback-section.tsx` - Mix & production elements
✅ `arrangement-feedback-section.tsx` - Energy, repetition, pacing

### Components Needed
⏳ `emotional-impact-section.tsx` - Emotions, memorability, originality
⏳ `actionable-feedback-section.tsx` - Best moment, weakness, quick win
⏳ `context-next-steps-section.tsx` - Target audience, next focus, quality level

---

## 📋 PHASE 3: TODO (Integration)

### 1. Update Review Form Hooks
**File:** `src/app/(dashboard)/reviewer/review/[id]/hooks/use-review-form.ts`

**Changes Needed:**
- Add state for all new fields
- Update validation to require key new fields:
  - `lowEndClarity` (required)
  - `vocalClarity` (required for tracks with vocals)
  - `quickWin` (required, min 10 words)
  - `biggestWeaknessSpecific` (required, min 15 words)
- Update draft save/load logic
- Update `getFormData()` to include new fields

### 2. Update Review Page
**File:** `src/app/(dashboard)/reviewer/review/[id]/page.tsx`

**Changes Needed:**
- Import new section components
- Add sections in order:
  1. First Impression (existing, keep as-is)
  2. Technical Feedback (NEW)
  3. Arrangement Feedback (NEW)
  4. Emotional Impact (NEW)
  5. Scores (existing, maybe deprecate later)
  6. Actionable Feedback (NEW - replaces bestPart/weakestPart)
  7. Context & Next Steps (NEW)
  8. Engagement (existing wouldListenAgain, etc.)
  9. Additional Notes (existing)
  10. Timestamp Notes (existing)

### 3. Update Submission API
**File:** `src/app/api/reviews/route.ts` (or similar)

**Changes Needed:**
- Accept new fields in request body
- Validate enum values
- Save to database with proper types
- Keep backwards compatibility (old schema still works)

### 4. Update Review Display
**File:** `src/components/reviews/review-display.tsx` (or track detail page)

**Changes Needed:**
- Show new feedback in organized sections
- Display technical feedback with icons/emojis
- Highlight "Quick Win" prominently
- Show quality level and next steps
- Progressive enhancement: show v2 fields if present, fall back to v1

### 5. Update Analytics
**Files:**
- Track analytics page
- Dashboard stats
- Admin analytics

**Changes Needed:**
- Aggregate new metrics:
  - Most common technical issues (low end, vocals, etc.)
  - Average quality level per artist
  - Most common "next focus" suggestions
  - Emotional impact distribution
- Add filters for new dimensions
- Keep existing analytics working

---

## 🎯 PHASE 4: OPTIMIZATION

### Reviewer Expertise Tailoring
**Concept:** Ask reviewer their expertise level once, then tailor questions

**Pro Producers Get:**
- Detailed technical questions (specific EQ ranges, compression ratios)
- Advanced terminology
- More granular options

**Casual Listeners Get:**
- Simplified questions
- Focus on emotion, energy, catchiness
- Less technical jargon

**Implementation:**
1. After first review, show modal: "How would you describe your production knowledge?"
2. Save to `ArtistProfile.reviewerExpertise`
3. Load on future reviews, show appropriate question set
4. Allow changing in account settings

### Visual Feedback Tools
**Waveform Annotation:**
- Click waveform to drop feedback pins
- Shows list of timestamp notes visually
- Artist sees exactly where issues are

**Energy Graph:**
- Drag curve showing perceived energy over time
- Visual representation of build/release
- Automatically detects flat sections

---

## 📊 METRICS TO TRACK

### Review Quality Metrics
1. **Specificity Score** - Auto-detect mentions of:
   - Timestamps
   - Specific elements ("kick", "vocals", "synth")
   - Numeric values ("3dB", "200Hz")

2. **Actionability Score** - Does review include:
   - Quick win with specific action?
   - Numeric suggestions (dB, Hz, seconds)?
   - Before/after guidance?

3. **Artist Satisfaction** - Post-review survey:
   - "Was this review helpful?" (1-5)
   - "Could you take action based on this?" (yes/no)
   - Net Promoter Score

### Platform Metrics
1. **Completion Rate** - Do better prompts = more completed reviews?
2. **Time to Complete** - Are reviews faster or slower with new system?
3. **Artist Retention** - Do better reviews = more resubmissions?
4. **Credit Velocity** - Does quality feedback drive more reviewing?

---

## 🚀 ROLLOUT PLAN

### Week 1: Soft Launch (Current)
✅ Database schema deployed
✅ Old reviews still work
⏳ New components being built

### Week 2: Beta Testing
- Deploy new form to 10% of users (feature flag)
- Collect feedback on UX
- Monitor completion rates
- Fix bugs

### Week 3: Full Rollout
- Deploy to 100% of users
- Announce new review system
- Update help docs
- Create video tutorial

### Week 4: Analytics & Iteration
- Analyze new data
- Identify most valuable new fields
- Optimize based on usage patterns
- Consider deprecating unused v1 fields

---

## 🔄 BACKWARDS COMPATIBILITY

### How It Works:
1. **Old reviews (v1):** Still display perfectly (use existing fields)
2. **New reviews (v2):** Show enhanced feedback + fall back to v1 fields
3. **Mixed data:** Some reviewers use v2, some use v1 - both work
4. **Analytics:** Calculate metrics from available data (v1 or v2)

### Migration Strategy:
- ❌ **Don't** force-migrate old reviews (data loss risk)
- ✅ **Do** let old and new coexist naturally
- ✅ **Do** encourage reviewers to try new system
- ✅ **Do** show artists which reviews used enhanced format

---

## 💡 FUTURE ENHANCEMENTS

### Auto-Generated Summary
After submission, use AI to generate:
- "Your key points: Mix needs work (vocals buried), great energy"
- "Priority 1: Turn vocals up 3dB"
- "Priority 2: Cut mud around 200Hz"

### Reference Track Comparison
- Upload reference track
- AI suggests quality gap
- "Your track vs. reference: -6dB quieter, less stereo width"

### Revision Tracking
- Artist implements suggestions
- Resubmits same track
- Reviewer sees: "Artist fixed vocals (+3dB) as suggested"

### Reviewer Badges
- "Technical Expert" - Gives detailed production feedback
- "Vibe Curator" - Great at emotional/artistic feedback
- "Quick Win Master" - Actionable suggestions that work
