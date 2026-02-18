# Payment Systems Bug Summary

## ✅ What's Working Correctly

### 1. Credit Top-Ups - NO BUGS
- Credits apply correctly when purchased
- Redirects work with success/cancel query params
- Referral system integrated
- Race condition protection with optimistic locking

### 2. PRO Reviewer Add-On - WORKING
- Correctly filters reviewers to 100+ reviews and 4.5+ rating
- Applied when `requestedProReviewers` flag is set
- AddOnPayment records created for accounting

### 3. Release Decision - WORKING PERFECTLY
- Payment completes successfully ($9.95)
- 10 expert reviewers assigned automatically
- Reviews collect all Release Decision fields (verdict, scores, fixes)
- Report auto-generates at 8/10 reviews (80% threshold)
- AI analysis via Claude API
- Email sent immediately to artist with comprehensive report
- Artist sees report on track detail page
- No issues found!

---

## ⚠️ POTENTIAL ISSUE: Rush Delivery Priority

### Current State
The rush delivery add-on ($10) sets a priority field in the ReviewQueue table:
- Rush Delivery: priority = **15** (highest)
- PRO/DEEP_DIVE: priority = **10**
- STANDARD: priority = **5**
- STARTER: priority = **0**

### The Problem
**I cannot find where legacy reviewers (ReviewerProfile) see their assigned tracks.**

The `/review` page only shows:
1. **PEER package tracks** (artist peer reviews) - browseable queue ordered by `createdAt`
2. **Claimed reviews** - ordered by `createdAt` (not priority)

Legacy packages (STARTER, STANDARD, PRO, DEEP_DIVE) with rush delivery:
- ✅ Priority is SET in ReviewQueue when assigned
- ❌ **Cannot verify if priority affects reviewer queue ordering**
- ❓ Where do legacy reviewers see their assigned tracks?

### Questions for You

1. **Do legacy reviewers (ReviewerProfile) still exist?**
   - Or has everything moved to the PEER system?

2. **Where do reviewers see rush delivery tracks?**
   - Is there a separate dashboard for assigned reviews?
   - Do rush tracks appear in a special queue?

3. **Should rush delivery work for PEER packages?**
   - Currently rush delivery only applies to legacy packages
   - PEER package queue doesn't use priority field at all

---

## Recommendation

**IF legacy reviewers still exist and see assigned tracks:**
- Need to find where they view their queue
- Verify that queue orders by `priority DESC` so rush delivery appears first

**IF only PEER system exists now:**
- Rush delivery feature needs to be updated to work with PEER packages
- Add priority field to PEER track queries
- Update `/review` page to order by priority

**Current State:**
- Rush delivery is set up in the database and webhook correctly
- Priority values are assigned correctly (15 for rush)
- BUT: Cannot verify if it actually affects reviewer assignment speed

**Please clarify:**
1. Are there still legacy ReviewerProfile reviewers?
2. Where do they see their assigned tracks?
3. Should I add priority ordering to the PEER package queue?

---

## Full Audit Report
See `PAYMENT_AUDIT_REPORT.md` for complete technical details of all payment flows.
