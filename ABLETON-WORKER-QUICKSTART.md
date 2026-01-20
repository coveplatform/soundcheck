# Ableton Worker - Quick Start

## What This Does

Users can now upload Ableton projects (ZIP files) and get automatic stem rendering!

## The Workflow

1. **User uploads Ableton project**
   - Goes to `/artist/submit`
   - Selects "Ableton" → "Full Project (ZIP)"
   - Uploads their "Collect All and Save" project ZIP
   - Track is created with `abletonRenderStatus = PENDING`

2. **Worker picks up the render**
   - Worker polls `/api/worker/pending-renders`
   - Downloads and extracts the project
   - Opens it in Ableton Live
   - Exports stems (all individual tracks)
   - Uploads stems back via `/api/worker/tracks/[trackId]/complete`

3. **User listens to stems**
   - Track page shows "Rendering..." while processing
   - When complete, stem mixer becomes available
   - User can listen to individual stems or the full mix

## How to Start the Worker

```bash
# 1. Install dependencies
cd scripts
pip install -r requirements.txt

# 2. Run the worker
python worker.py
```

The worker will start polling for renders every 10 seconds.

## ⚠️ Important: Ableton Automation

The worker **currently does not automatically open Ableton**. You have two options:

### Option 1: Manual Export (Start Here)

1. Run the worker
2. When a render is pending, the worker downloads the project and logs the path
3. Open that `.als` file in Ableton manually
4. File → Export Audio/Video → Export All Individual Tracks
5. Save to `public/generated-stems/<trackId>/`
6. The worker will upload them

This lets you test the full workflow immediately without any automation setup.

### Option 2: Automated Rendering

See `scripts/WORKER-SETUP.md` for detailed instructions on automating Ableton using:
- AbletonOSC (Mac with Max for Live)
- pywinauto (Windows)
- AppleScript (macOS)

## Testing the Flow

1. **Start your dev server**
   ```bash
   npm run dev
   ```

2. **Start the worker** (in a new terminal)
   ```bash
   cd scripts
   python worker.py
   ```

3. **Upload a test project**
   - Go to http://localhost:3000/artist/submit
   - Upload an Ableton project ZIP
   - Check worker logs - it should detect the pending render

4. **Export stems** (manual for now)
   - Worker logs the project path
   - Open in Ableton and export tracks
   - Save to the directory the worker specifies

5. **Check the track page**
   - Stems should appear in the mixer
   - You can play individual stems or the full mix

## API Endpoints

The worker uses these endpoints:

- `GET /api/worker/pending-renders` - Get tracks waiting to be rendered
- `POST /api/worker/tracks/[trackId]/complete` - Upload rendered stems

Authentication: Bearer token (`WORKER_API_KEY`, defaults to `dev-worker-key`)

## Environment Variables

```bash
# .env.local (optional)
WORKER_API_KEY=dev-worker-key  # Must match worker config
```

```bash
# Worker config (optional)
export API_URL=http://localhost:3000
export WORKER_API_KEY=dev-worker-key
```

## Next Steps

1. Test the manual workflow end-to-end
2. Choose an automation approach from `scripts/WORKER-SETUP.md`
3. Implement automated Ableton rendering
4. Consider cloud storage for stem files (S3, etc.)

## Production Deployment

For production, you'll want to:
- Run the worker as a service (Docker, systemd, etc.)
- Use cloud storage for stem files (not `public/` folder)
- Add monitoring and error alerts
- Scale to multiple workers for parallel processing
- Add render timeout limits and retry logic
