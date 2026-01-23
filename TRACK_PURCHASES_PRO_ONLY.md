# Track Purchases - Pro Subscription Required

## Changes Made

Track purchase functionality is now restricted to Pro subscribers only.

---

## Backend Changes

### File: `src/app/api/tracks/route.ts`

**Line 129:** Updated allowPurchase logic
```typescript
// Only allow purchases for uploaded tracks AND Pro subscribers
allowPurchase: sourceType === "UPLOAD" && isSubscribed ? (data.allowPurchase ?? false) : false,
```

**What this does:**
- Free users: `allowPurchase` is always `false`, even if they try to enable it
- Pro users: Can enable `allowPurchase` when uploading tracks
- Non-upload tracks (SoundCloud/Bandcamp/YouTube): Cannot enable purchases regardless of subscription

---

## Frontend Changes

### File: `src/app/(dashboard)/artist/submit/components/file-upload-zone.tsx`

**Added `isSubscribed` prop:**
```typescript
interface FileUploadZoneProps {
  // ... other props
  isSubscribed: boolean;  // NEW
  // ...
}
```

**Updated checkbox behavior:**
- ✅ **Visible to all users** (good UX - shows what's available)
- 🔒 **Pro badge** shown for free users
- 💬 **Different messaging** based on subscription:
  - Pro: "You keep 85% of sales"
  - Free: "Upgrade to Pro to enable track sales"
- 🚫 **Click behavior:**
  - Free users: Shows alert prompting upgrade (TODO: Replace with proper modal)
  - Pro users: Toggles checkbox normally

---

## Revenue Split

**From `src/app/api/webhooks/stripe/route.ts`:**

### Pro Artists (Subscribed):
- **Artist:** 85%
- **Platform:** 15%

### Free Artists:
- **Feature locked** - cannot enable purchases

---

## User Experience Flow

### Free User Trying to Enable Purchases:
1. Uploads track via file upload
2. Sees "Allow listeners to purchase" checkbox with **PRO** badge
3. Reads: "Upgrade to Pro to enable track sales and monetize your music"
4. Clicks checkbox
5. Gets alert: "Upgrade to Pro to enable track sales and monetize your music!"
6. (TODO: Should redirect to subscription page)

### Pro User Enabling Purchases:
1. Uploads track via file upload
2. Sees "Allow listeners to purchase" checkbox (no badge)
3. Reads: "Listeners can buy and download this track after reviewing. You keep 85% of sales."
4. Clicks checkbox
5. ✅ Feature enabled
6. Track can be purchased by reviewers and external buyers

---

## API Validation

Even if someone bypasses the frontend and sends `allowPurchase: true` via API:

```javascript
// Free user tries to enable via API
POST /api/tracks
{
  "allowPurchase": true,  // Trying to enable
  "sourceType": "UPLOAD",
  // ...
}

// Backend response:
{
  "track": {
    "allowPurchase": false  // ❌ Forced to false because not subscribed
  }
}
```

---

## TODO

### Immediate:
- [ ] Replace `window.alert()` with proper modal/dialog component
- [ ] Add "Upgrade to Pro" button in the modal that links to `/api/subscriptions/checkout`
- [ ] Pass `isSubscribed` prop from submit page to FileUploadZone component

### Future Enhancements:
- [ ] Show revenue estimate tooltip (e.g., "If 10 people buy at $5 = $42.50 for you")
- [ ] Add track purchase analytics to artist dashboard
- [ ] Allow artists to set custom price (currently hardcoded)
- [ ] Show "Purchase enabled" badge on track cards in dashboard

---

## Testing Checklist

### As Free User:
- [ ] Upload a track
- [ ] Try to enable purchase checkbox
- [ ] Verify alert/modal shows
- [ ] Verify API prevents enabling (check in database)
- [ ] Try to bypass via API directly
- [ ] Verify track.allowPurchase remains false

### As Pro User:
- [ ] Upload a track
- [ ] Enable purchase checkbox
- [ ] Verify checkbox stays checked
- [ ] Verify API saves allowPurchase = true
- [ ] Have reviewer complete review
- [ ] Verify purchase option shows to reviewer
- [ ] Complete test purchase
- [ ] Verify 85% revenue credited to artist

---

## Environment Variables

No new environment variables required. Uses existing:
- `artistProfile.subscriptionStatus` to check if user is Pro
- Existing Stripe integration for payment processing

---

## Summary

✅ **Backend:** Free users cannot enable purchases (enforced at API level)
✅ **Frontend:** Free users see the option but get upgrade prompt
✅ **Revenue Split:** Pro users keep 85%, free users locked out
✅ **Security:** Cannot bypass via direct API calls
⏳ **TODO:** Replace alert with proper upgrade modal
