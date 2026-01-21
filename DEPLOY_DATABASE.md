# Database Deployment Guide

## Changes Made
- Added `ExternalPurchase` table for public track sales
- Added `TrackAffiliateLink` table for campaign tracking
- Added sharing fields to `Track` model (trackShareId, sharingEnabled, sharingMode, salePrice, etc.)
- Added new enums: `SharingMode`, `ExternalPurchaseStatus`
- Added affiliate relations to `User` model

## Deploy to Production (Neon)

### Step 1: Set Production Database URL
```bash
# Get your Neon connection string from:
# Vercel Dashboard → Project → Settings → Environment Variables → DATABASE_URL
# OR Neon Dashboard → Connection String

# Set it temporarily (for this terminal session)
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Step 2: Push Schema Changes
```bash
npx prisma db push
```

This will:
- ✅ Add new tables (ExternalPurchase, TrackAffiliateLink)
- ✅ Add new columns to Track table
- ✅ Create new enums
- ✅ Not lose any existing data (safe operation)

### Step 3: Verify
```bash
# Check the schema is applied
npx prisma studio
```

---

## Alternative: Create Proper Migration (Optional)

If you want a proper migration file for history:

```bash
# 1. Create migration from current schema
npx prisma migrate dev --name add_track_sharing_and_sales --create-only

# 2. Review the generated SQL in:
#    prisma/migrations/[timestamp]_add_track_sharing_and_sales/migration.sql

# 3. Deploy to production
export DATABASE_URL="your-neon-production-url"
npx prisma migrate deploy
```

---

## Vercel Deployment

After pushing schema changes, deploy to Vercel:

```bash
git add .
git commit -m "Add track sharing and affiliate system"
git push origin main
```

Vercel will auto-deploy. Your DATABASE_URL environment variable is already set in Vercel, so the app will connect to the updated schema automatically.

---

## Environment Variables Checklist

Make sure these are set in Vercel:

### Required (should already have):
- ✅ `DATABASE_URL` - Neon connection string
- ✅ `STRIPE_SECRET_KEY` - Stripe secret key
- ✅ `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- ✅ `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- ✅ `NEXTAUTH_SECRET` - NextAuth secret
- ✅ `NEXTAUTH_URL` - Your production URL (https://mixreflect.com)

### S3 Storage (for downloads):
- ✅ `UPLOADS_S3_REGION`
- ✅ `UPLOADS_S3_BUCKET`
- ✅ `UPLOADS_S3_ACCESS_KEY_ID`
- ✅ `UPLOADS_S3_SECRET_ACCESS_KEY`
- ✅ `UPLOADS_PUBLIC_BASE_URL`

### Email (for purchase confirmations):
- ✅ `RESEND_API_KEY`
- ✅ `RESEND_FROM_EMAIL`

### App URL:
- ✅ `NEXT_PUBLIC_APP_URL=https://mixreflect.com`

---

## After Deployment

1. **Test the sharing flow:**
   - Upload a track
   - Click "Enable Sharing"
   - Create affiliate link
   - Visit public page

2. **Test purchase flow:**
   - Enable sales mode (requires Pro)
   - Visit public page
   - Complete purchase with test card
   - Check email for download link

3. **Verify webhook:**
   - Stripe Dashboard → Webhooks
   - Ensure `https://mixreflect.com/api/webhooks/stripe` is configured
   - Test with Stripe CLI: `stripe trigger checkout.session.completed`

---

## Rollback (if needed)

If something goes wrong:

```bash
# Option 1: Revert code changes
git revert HEAD
git push origin main

# Option 2: Restore database snapshot
# (Use Neon dashboard to restore from backup)
```

---

## Notes

- **Safe operation:** `db push` adds new tables/columns without dropping existing data
- **No downtime:** Schema changes are additive (new tables, new nullable columns)
- **Backwards compatible:** Old code will continue working (new fields are optional)
