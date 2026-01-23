# Affiliate Link System - Complete Explanation

## Overview

The affiliate system allows **anyone** (artists, reviewers, or external promoters) to earn a **10% commission** on track sales by sharing special affiliate links.

---

## Who Can Create Affiliate Links?

### ✅ Track Owners (Artists)
- Can create multiple affiliate links for their own tracks
- Each link can track different campaigns (e.g., "Twitter", "Instagram", "Newsletter")

### ✅ Anyone Else
- Currently, the API allows anyone with an account to create affiliate links for any track
- Commission is paid to whoever created the link

---

## How It Works: Step-by-Step

### **STEP 1: Artist Enables Public Sharing**

**Artist Actions:**
1. Upload and publish a track
2. Enable "Public Sharing" on the track
3. Set a sale price (e.g., $5.00 USD)

**System Creates:**
- Public share URL: `https://mixreflect.com/t/{trackShareId}`
- Track is now accessible to anyone with the link

---

### **STEP 2: Someone Creates an Affiliate Link**

**Who:** Artist, reviewer, or any user
**Where:** Track sharing/sales page

**API Call:**
```
POST /api/tracks/{trackId}/affiliate-links
{
  "name": "Twitter Campaign",
  "code": "twitter-jan" // Optional custom code
}
```

**System Creates:**
```
Affiliate Link: https://mixreflect.com/t/{trackShareId}?ref=twitter-jan

Database Record:
- code: "twitter-jan"
- trackId: {track}
- createdByUserId: {user who created it}
- clickCount: 0
- purchaseCount: 0
- totalRevenue: 0
```

---

### **STEP 3: Promoter Shares the Affiliate Link**

**Promoter shares:**
```
https://mixreflect.com/t/abc123xyz?ref=twitter-jan
```

**Where they share it:**
- Twitter/X
- Instagram
- TikTok
- Discord
- Email newsletter
- Blog posts
- Anywhere!

---

### **STEP 4: Listener Clicks the Link**

**What happens:**
1. Listener visits: `https://mixreflect.com/t/abc123xyz?ref=twitter-jan`
2. Public track page loads
3. System logs:
   - Click count increments
   - Affiliate code `twitter-jan` is tracked
4. Listener can:
   - Listen to track preview
   - See track details
   - Click "Buy Track" button

---

### **STEP 5: Listener Buys the Track**

**Checkout Flow:**
```
1. Listener clicks "Buy Track" ($5.00)
2. Enters email (no account needed)
3. System creates checkout with affiliate code attached
4. Redirects to Stripe Checkout
5. Listener pays $5.00
6. Stripe webhook fires
```

**Revenue Split Calculation:**

Example: $5.00 track sale via affiliate link

#### If Artist is **Pro Subscriber**:
```
Total Sale:              $5.00 (100%)

Platform Fee (15%):      -$0.75
Affiliate Commission:    -$0.50  (10% of total)
─────────────────────────────────
Artist Keeps:            $3.75  (75%)
```

#### If Artist is **Free User**:
```
Total Sale:              $5.00 (100%)

Platform Fee (20%):      -$1.00
Affiliate Commission:    -$0.50  (10% of total)
─────────────────────────────────
Artist Keeps:            $3.50  (70%)
```

---

### **STEP 6: Commissions Paid**

**After successful purchase, webhook processes:**

#### Artist Gets Credited:
```
artistProfile.pendingBalance += $3.75  (or $3.50)
artistProfile.totalEarnings += $3.75
```

#### Affiliate Gets Credited:
If affiliate creator is an **Artist**:
```
artistProfile.pendingBalance += $0.50
artistProfile.totalEarnings += $0.50
```

If affiliate creator is a **Reviewer/Listener**:
```
listenerProfile.pendingBalance += $0.50
listenerProfile.totalEarnings += $0.50
listenerProfile.affiliateEarnings += $0.50
```

#### Affiliate Link Stats Updated:
```
trackAffiliateLink:
  purchaseCount: +1
  totalRevenue: +$0.50
```

---

## Multiple Affiliate Links Per Track

An artist can create multiple affiliate links to track different campaigns:

### Example Campaign Tracking:

```
Link 1: https://mixreflect.com/t/abc123?ref=twitter-jan
        Name: "Twitter January Campaign"
        Stats: 150 clicks, 3 purchases, $1.50 earned

Link 2: https://mixreflect.com/t/abc123?ref=instagram-jan
        Name: "Instagram Stories"
        Stats: 80 clicks, 1 purchase, $0.50 earned

Link 3: https://mixreflect.com/t/abc123?ref=newsletter
        Name: "Email Newsletter"
        Stats: 50 clicks, 5 purchases, $2.50 earned
```

**Artist Dashboard Shows:**
- Which campaigns drive most traffic
- Which convert best
- Total commission paid out per link

---

## Who Can Be an Affiliate?

### ✅ **Artists** (Self-Promotion)
- Create affiliate links for their own tracks
- Share on social media
- Earn commission on their own sales
- Track which platforms work best

### ✅ **Reviewers** (Cross-Promotion)
- Create affiliate links for tracks they reviewed
- Recommend tracks to their audience
- Earn passive income from promoting good music

### ✅ **External Promoters** (Music Blogs, Playlists, Influencers)
- Don't need to be users initially
- Create account → Create affiliate link
- Share with their audience
- Earn 10% commission on sales

### ✅ **Anyone with an Account**
- If you like a track, create an affiliate link
- Share it wherever you want
- Earn commission if someone buys through your link

---

## Affiliate Link Validation

**When buyer checks out with affiliate code:**

1. **Check if code exists:**
   - Code must exist in database
   - Must be attached to the correct track

2. **Check if code is active:**
   - `isActive: true` required
   - Artists can deactivate old campaigns

3. **If invalid:**
   - Purchase still proceeds
   - No commission paid
   - No error shown to buyer

---

## Revenue Split Summary

### **Pro Artist** + Affiliate Link:
```
$10 sale:
- Platform: $1.50 (15%)
- Affiliate: $1.00 (10%)
- Artist: $7.50 (75%)
```

### **Free Artist** + Affiliate Link:
```
$10 sale:
- Platform: $2.00 (20%)
- Affiliate: $1.00 (10%)
- Artist: $7.00 (70%)
```

### **Pro Artist** + No Affiliate:
```
$10 sale:
- Platform: $1.50 (15%)
- Artist: $8.50 (85%)
```

### **Free Artist** + No Affiliate:
```
$10 sale:
- Platform: $2.00 (20%)
- Artist: $8.00 (80%)
```

---

## API Endpoints

### Create Affiliate Link
```
POST /api/tracks/{trackId}/affiliate-links
Body: {
  "name": "Campaign Name",
  "code": "optional-custom-code"  // Auto-generated if omitted
}
```

### List Affiliate Links
```
GET /api/tracks/{trackId}/affiliate-links
Returns: Array of affiliate links with stats
```

### Update Affiliate Link
```
PATCH /api/affiliate-links/{linkId}
Body: {
  "name": "Updated Name",
  "isActive": false  // Deactivate campaign
}
```

### Delete Affiliate Link
```
DELETE /api/affiliate-links/{linkId}
```

---

## Database Schema

### TrackAffiliateLink Table
```prisma
model TrackAffiliateLink {
  id                String   @id @default(cuid())
  trackId           String
  code              String   @unique  // e.g., "twitter-jan"
  name              String             // e.g., "Twitter Campaign"
  createdByUserId   String

  // Stats
  clickCount        Int      @default(0)
  playCount         Int      @default(0)
  purchaseCount     Int      @default(0)
  totalRevenue      Int      @default(0)  // in cents

  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  track             Track    @relation(...)
  createdBy         User     @relation(...)
}
```

### ExternalPurchase Table
```prisma
model ExternalPurchase {
  id                   String   @id
  trackId              String
  buyerEmail           String
  buyerName            String?

  amount               Int      // Total in cents
  platformFee          Int
  affiliateCommission  Int
  artistAmount         Int

  affiliateCode        String?  // e.g., "twitter-jan"
  affiliateUserId      String?  // Who gets the commission

  status               String   // PENDING | COMPLETED | FAILED
  // ...
}
```

---

## Use Cases

### Use Case 1: Artist Self-Promotion
**Sarah (Artist):**
1. Uploads track "Summer Vibes"
2. Enables public sharing, sets price $3
3. Creates affiliate links:
   - `twitter-promo`
   - `instagram-stories`
   - `tiktok-snippet`
4. Shares each link on respective platform
5. Tracks which platform drives most sales
6. Earns commission on own sales (75% total as Pro)

---

### Use Case 2: Reviewer Cross-Promotion
**Mike (Reviewer):**
1. Reviews track "Summer Vibes" by Sarah
2. Loves the track
3. Creates affiliate link: `mike-recommendation`
4. Posts on his music blog: "Check out this amazing track!"
5. His audience buys 5 copies
6. Mike earns: 5 × $0.30 = $1.50 commission

---

### Use Case 3: Music Blog Promotion
**IndieBeats Blog:**
1. Features track in "This Week's Picks"
2. Creates affiliate link: `indiebeats-weekly`
3. Blog has 10,000 readers
4. 50 people buy the track
5. Blog earns: 50 × $0.30 = $15.00 commission

---

### Use Case 4: Playlist Curator
**Spotify Playlist Curator:**
1. Discovers track on MixReflect
2. Adds to Spotify playlist
3. Creates affiliate link: `playlist-summer2026`
4. Adds link to playlist description
5. Fans discover and buy
6. Curator earns passive income

---

## Analytics & Tracking

**Artist Dashboard Shows:**
```
Affiliate Links for "Summer Vibes":

Link: twitter-promo
- Clicks: 1,250
- Plays: 450
- Purchases: 15
- Revenue: $4.50
- Conversion: 1.2%

Link: instagram-stories
- Clicks: 800
- Plays: 300
- Purchases: 22
- Revenue: $6.60
- Conversion: 2.75%

Link: tiktok-snippet
- Clicks: 3,500
- Plays: 1,200
- Purchases: 45
- Revenue: $13.50
- Conversion: 1.29%
```

**Insights:**
- Instagram has best conversion rate
- TikTok drives most volume
- Twitter drives traffic but lower conversion

---

## Current Limitations

### ⚠️ Things to Consider:

1. **No Commission Tiers:**
   - Everyone gets 10% flat
   - Could implement volume bonuses

2. **No Minimum Payout:**
   - Currently no threshold
   - Might want $10 minimum for withdrawals

3. **No Link Expiration:**
   - Links work forever unless deactivated
   - Could add expiration dates

4. **Open Creation:**
   - Anyone can create links for any track
   - Artist has no approval process
   - Could restrict to approved affiliates

5. **No Fraud Detection:**
   - No click fraud prevention
   - No self-purchase detection
   - Should add IP tracking

---

## Summary

**The affiliate system works like this:**

1. **Artist** uploads track + enables sharing + sets price
2. **Anyone** can create an affiliate link with custom code
3. **Promoter** shares: `mixreflect.com/t/{id}?ref={code}`
4. **Buyer** clicks link → buys track
5. **System** splits revenue:
   - Platform: 15-20%
   - Affiliate: 10%
   - Artist: 70-75%
6. **Commissions** auto-credited to balances
7. **Withdrawal** via Stripe Connect

It's a **win-win-win**:
- Artists get more sales
- Promoters earn passive income
- Platform grows through network effects

The `?ref=` parameter in the URL is what ties everything together!
