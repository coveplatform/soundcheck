# Track Cleanup System

## Problem
When users start the Release Decision submission flow but abandon the checkout process, tracks are created in the database with:
- Status: `UPLOADED`
- Package type: `PEER`
- Reviews requested: `0`
- No payment completed

These abandoned tracks clutter the database and user's "My Tracks" list.

## Solution
Automated cleanup system that runs daily via Vercel Cron to delete abandoned tracks.

---

## How It Works

### Two Cleanup Tasks

#### 1. Abandoned Tracks (24 hour cleanup)
Deletes tracks that meet ALL criteria:
- Status: `UPLOADED`
- Reviews requested: `0`
- Created more than **24 hours ago**
- Has **no reviews** (safety check)

**Use case:** User started checkout but abandoned immediately

#### 2. Expired Checkouts (7 day cleanup)
Deletes tracks that meet ALL criteria:
- Status: `UPLOADED` (any reviews requested)
- Created more than **7 days ago**

**Use case:** User started checkout but never completed payment (more aggressive)

---

## Cron Schedule

Runs automatically at **3:00 AM UTC daily** via Vercel Cron.

See: `vercel.json`
```json
{
  "path": "/api/cron/cleanup",
  "schedule": "0 3 * * *"
}
```

---

## Setup

### 1. Environment Variable
Set `CRON_SECRET` in your environment:

**Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add `CRON_SECRET` with a random string (e.g., generated with `openssl rand -base64 32`)
3. Apply to Production, Preview, and Development

**Local `.env`:**
```bash
CRON_SECRET=your-random-secret-here
```

### 2. Vercel Cron (Automatic)
Vercel automatically registers cron jobs from `vercel.json` on deployment. No manual setup needed.

### 3. Manual Trigger (for testing)
You can manually trigger cleanup via API:

```bash
curl -X POST https://mixreflect.com/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## API Reference

### `POST /api/cron/cleanup`

**Authentication:** Requires `CRON_SECRET` in Authorization header

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "abandoned": {
    "deleted": 3,
    "tracks": [
      {
        "id": "clx123...",
        "title": "My Track",
        "createdAt": "2026-02-17T10:30:00.000Z"
      }
    ]
  },
  "expired": {
    "deleted": 1,
    "tracks": [...]
  },
  "total": 4,
  "timestamp": "2026-02-18T03:00:00.000Z"
}
```

---

## Monitoring

Check Vercel's Cron Logs to monitor cleanup:

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Select latest deployment
3. Click "Functions" tab
4. Look for `/api/cron/cleanup` logs

**Expected log output:**
```
[Cleanup] Starting cleanup job...
[Cleanup] Deleted 3 abandoned tracks: [...]
[Cleanup] Deleted 1 expired checkout tracks: [...]
[Cleanup] Job complete. Deleted 4 tracks total (3 abandoned, 1 expired)
```

---

## Safety Features

1. **Only deletes tracks with 0 reviews** - Prevents deleting tracks that somehow got reviews
2. **Time-based protection** - Waits 24 hours before cleanup (users have time to complete payment)
3. **Status check** - Only deletes UPLOADED status (never touches QUEUED, IN_PROGRESS, or COMPLETED)
4. **Logged output** - All deletions are logged with track details

---

## Code Locations

- **Cleanup logic:** `src/lib/cleanup.ts`
- **API endpoint:** `src/app/api/cron/cleanup/route.ts`
- **Cron config:** `vercel.json`
- **Environment:** `.env.example` (CRON_SECRET)

---

## FAQ

**Q: What if a user completes payment during the 24-hour window?**
A: The webhook updates the track to QUEUED status immediately, so it won't match cleanup criteria.

**Q: Can abandoned tracks be recovered?**
A: No, they're permanently deleted. Users need to re-upload if they want to submit again.

**Q: What about tracks uploaded via PEER package?**
A: PEER tracks that get reviews won't be deleted (review count > 0). PEER tracks with 0 reviews and UPLOADED status will be cleaned up after 24 hours.

**Q: How do I disable cleanup temporarily?**
A: Comment out the cleanup cron job in `vercel.json` and redeploy.

---

## Testing

**Local testing:**
```bash
# Set CRON_SECRET in .env
CRON_SECRET=test-secret

# Run cleanup endpoint
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer test-secret"
```

**Production testing:**
```bash
# Trigger cleanup manually (use real CRON_SECRET from Vercel)
curl -X POST https://mixreflect.com/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
